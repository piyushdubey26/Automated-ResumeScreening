import { Request, Response } from 'express';
import { z } from 'zod';
import { BillingService } from '../services/billingService';
import prisma from '../config/db';

const createInvoiceSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  admissionId: z.string().uuid().optional(),
  discountAmount: z.number().nonnegative().optional(),
  items: z.array(
    z.object({
      name: z.string().min(1),
      category: z.enum(['CONSULTATION', 'LAB_TEST', 'MEDICINE', 'ROOM_CHARGE', 'PROCEDURE', 'OTHER']),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    })
  ).min(1),
});

const capturePaymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'ONLINE']),
  transactionReference: z.string().optional(),
});

export class BillingController {
  static async listInvoices(req: Request, res: Response): Promise<void> {
    try {
      const patientId = req.query.patientId?.toString();
      const status = req.query.status?.toString();

      // Enforce patient limits on Patient role
      if (req.user?.role === 'PATIENT') {
        const patient = await prisma.patient.findUnique({ where: { userId: req.user.userId } });
        if (!patient) {
          res.status(404).json({ error: 'Patient profile not found' });
          return;
        }
        const invoices = await BillingService.getInvoices({ patientId: patient.id, status });
        res.json(invoices);
        return;
      }

      const invoices = await BillingService.getInvoices({ patientId, status });
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve invoices list' });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createInvoiceSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const invoice = await BillingService.createInvoice(parsed.data, req.user?.userId || '');
      res.status(201).json(invoice);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Invoice generation failed' });
    }
  }

  static async pay(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const parsed = capturePaymentSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      // Secure payment limits: Patients can pay invoices, check invoice owner
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { patient: true },
      });

      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }

      if (req.user?.role === 'PATIENT' && invoice.patient.userId !== req.user.userId) {
        res.status(403).json({ error: 'Access denied: You are only permitted to pay your own invoices' });
        return;
      }

      const payment = await BillingService.recordPayment(id, parsed.data, req.user?.userId || '');
      res.json({ message: 'Payment recorded successfully', payment });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Payment processing failed' });
    }
  }
}
