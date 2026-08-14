import prisma from '../config/db';

export class BillingService {
  static async getInvoices(query: { patientId?: string; status?: string }) {
    const { patientId, status } = query;
    const whereClause: any = {};

    if (patientId) whereClause.patientId = patientId;
    if (status) whereClause.status = status;

    return prisma.invoice.findMany({
      where: whereClause,
      include: {
        patient: true,
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createInvoice(
    data: {
      patientId: string;
      appointmentId?: string;
      admissionId?: string;
      discountAmount?: number;
      items: Array<{
        name: string;
        category: string; // "CONSULTATION", "LAB_TEST", "MEDICINE", "ROOM_CHARGE", "PROCEDURE", "OTHER"
        quantity: number;
        unitPrice: number;
      }>;
    },
    creatorUserId: string
  ) {
    const discount = data.discountAmount || 0;
    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = (totalAmount - discount) * 0.1; // 10% tax
    const payableAmount = totalAmount - discount + taxAmount;

    // Generate readable invoice ID
    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-2026-${String(2001 + count).padStart(4, '0')}`;

    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          patientId: data.patientId,
          appointmentId: data.appointmentId || null,
          admissionId: data.admissionId || null,
          invoiceNumber,
          totalAmount,
          discountAmount: discount,
          taxAmount,
          payableAmount,
          status: 'UNPAID',
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days due
        },
      });

      for (const item of data.items) {
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: creatorUserId,
          action: 'INVOICE_CREATE',
          entity: 'Invoice',
          entityId: invoice.id,
          newValue: `Generated invoice: ${invoiceNumber}. Total: $${payableAmount.toFixed(2)}`,
        },
      });

      return invoice;
    });
  }

  static async recordPayment(
    invoiceId: string,
    data: {
      amount: number;
      paymentMethod: string; // "CASH", "CARD", "UPI", "ONLINE"
      transactionReference?: string;
    },
    creatorUserId: string
  ) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const previousPaymentsTotal = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const newPaymentsTotal = previousPaymentsTotal + data.amount;

    if (newPaymentsTotal > invoice.payableAmount) {
      throw new Error('Payment amount exceeds invoice balance');
    }

    const status = newPaymentsTotal >= invoice.payableAmount ? 'PAID' : 'PARTIALLY_PAID';

    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          transactionReference: data.transactionReference,
          paymentStatus: 'COMPLETED',
        },
      });

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status },
      });

      await tx.auditLog.create({
        data: {
          userId: creatorUserId,
          action: 'PAYMENT_RECORD',
          entity: 'Payment',
          entityId: payment.id,
          newValue: `Recorded payment of $${data.amount} for invoice ${invoice.invoiceNumber}. Status: ${status}`,
        },
      });

      return payment;
    });
  }
}
