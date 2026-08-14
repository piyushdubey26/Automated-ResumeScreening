import prisma from '../config/db';

export class InventoryService {
  static async getMedicines(query: { search?: string; category?: string }) {
    const { search, category } = query;
    const whereClause: any = {};

    if (category) {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.medicine.findMany({
      where: whereClause,
      include: {
        inventoryItems: {
          include: { supplier: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getInventoryAlerts() {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setDate(today.getDate() + 30);

    // Fetch low stock items
    const lowStock = await prisma.inventory.findMany({
      where: {
        quantity: { lte: 10 },
        status: { not: 'EXPIRED' },
      },
      include: { medicine: true },
    });

    // Fetch expiring soon batches
    const expiringSoon = await prisma.inventory.findMany({
      where: {
        expiryDate: {
          gt: today,
          lte: nextMonth,
        },
      },
      include: { medicine: true },
    });

    // Fetch expired batches
    const expired = await prisma.inventory.findMany({
      where: {
        expiryDate: {
          lte: today,
        },
      },
      include: { medicine: true },
    });

    return {
      lowStock,
      expiringSoon,
      expired,
    };
  }

  static async dispensePrescription(prescriptionId: string, pharmacistUserId: string) {
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: { items: true },
    });

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    if (prescription.status === 'DISPENSED') {
      throw new Error('This prescription is already dispensed');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Decrement stock for each item
      for (const item of prescription.items) {
        // Find first available batch that has stock
        const batches = await tx.inventory.findMany({
          where: {
            medicineId: item.medicineId,
            quantity: { gt: 0 },
            expiryDate: { gt: new Date() }, // Not expired
          },
          orderBy: { expiryDate: 'asc' }, // FIFO: first expiring first
        });

        if (batches.length === 0) {
          const med = await tx.medicine.findUnique({ where: { id: item.medicineId } });
          throw new Error(`Out of stock for medicine: ${med?.name || 'Unknown'}`);
        }

        // Deduct quantities
        let quantityNeeded = parseInt(item.duration.replace(/[^0-9]/g, '')) || 5; // default to a reasonable amount if text
        // Deduct from batches
        for (const batch of batches) {
          if (quantityNeeded <= 0) break;

          const toDeduct = Math.min(batch.quantity, quantityNeeded);
          await tx.inventory.update({
            where: { id: batch.id },
            data: {
              quantity: batch.quantity - toDeduct,
              status: batch.quantity - toDeduct === 0 ? 'OUT_OF_STOCK' : (batch.quantity - toDeduct <= 10 ? 'LOW_STOCK' : 'IN_STOCK'),
            },
          });
          quantityNeeded -= toDeduct;
        }

        if (quantityNeeded > 0) {
          const med = await tx.medicine.findUnique({ where: { id: item.medicineId } });
          throw new Error(`Insufficient stock in non-expired batches for medicine: ${med?.name}`);
        }
      }

      // 2. Mark prescription as dispensed
      const updatedPrescription = await tx.prescription.update({
        where: { id: prescriptionId },
        data: { status: 'DISPENSED' },
      });

      // 3. Log Audit details
      await tx.auditLog.create({
        data: {
          userId: pharmacistUserId,
          action: 'PRESCRIPTION_DISPENSE',
          entity: 'Prescription',
          entityId: prescriptionId,
          newValue: 'Prescription items dispensed in full',
        },
      });

      return updatedPrescription;
    });
  }
}
