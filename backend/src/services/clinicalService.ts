import prisma from '../config/db';

export class ClinicalService {
  static async createMedicalRecord(
    data: {
      patientId: string;
      doctorId: string;
      appointmentId?: string;
      type: string; // "CONSULTATION", "ADMISSION", "EMERGENCY"
      summary?: string;
      clinicalNotes?: string;
      symptoms?: string;
      vitals?: {
        bloodPressure: string;
        heartRate: number;
        temperature: number;
        spo2: number;
        respiratoryRate: number;
        weight: number;
      };
      diagnoses?: Array<{
        code?: string;
        description: string;
        type?: string; // "PRIMARY", "SECONDARY"
      }>;
      prescriptionItems?: Array<{
        medicineId: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string;
      }>;
      labOrders?: Array<{
        testType: string; // e.g. "CBC", "LFT"
        notes?: string;
      }>;
    },
    creatorUserId: string
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Create Medical Record Header
      const record = await tx.medicalRecord.create({
        data: {
          patientId: data.patientId,
          doctorId: data.doctorId,
          appointmentId: data.appointmentId || null,
          type: data.type,
          summary: data.summary,
          clinicalNotes: data.clinicalNotes,
          symptoms: data.symptoms,
        },
      });

      // 2. Add Vitals
      if (data.vitals) {
        await tx.vital.create({
          data: {
            medicalRecordId: record.id,
            patientId: data.patientId,
            bloodPressure: data.vitals.bloodPressure,
            heartRate: data.vitals.heartRate,
            temperature: data.vitals.temperature,
            spo2: data.vitals.spo2,
            respiratoryRate: data.vitals.respiratoryRate,
            weight: data.vitals.weight,
            recordedById: creatorUserId,
          },
        });
      }

      // 3. Add Diagnoses
      if (data.diagnoses && data.diagnoses.length > 0) {
        for (const diag of data.diagnoses) {
          await tx.diagnosis.create({
            data: {
              medicalRecordId: record.id,
              code: diag.code || null,
              description: diag.description,
              type: diag.type || 'PRIMARY',
            },
          });
        }
      }

      // 4. Add Prescription
      if (data.prescriptionItems && data.prescriptionItems.length > 0) {
        const prescription = await tx.prescription.create({
          data: {
            medicalRecordId: record.id,
            patientId: data.patientId,
            doctorId: data.doctorId,
            appointmentId: data.appointmentId || null,
            status: 'ACTIVE',
          },
        });

        for (const item of data.prescriptionItems) {
          await tx.prescriptionItem.create({
            data: {
              prescriptionId: prescription.id,
              medicineId: item.medicineId,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              instructions: item.instructions,
            },
          });
        }
      }

      // 5. Add Lab Orders
      if (data.labOrders && data.labOrders.length > 0) {
        for (const order of data.labOrders) {
          await tx.labOrder.create({
            data: {
              patientId: data.patientId,
              doctorId: data.doctorId,
              appointmentId: data.appointmentId || null,
              medicalRecordId: record.id,
              status: 'ORDERED',
              notes: order.notes,
            },
          });
        }
      }

      // If appointment exists, mark status as completed
      if (data.appointmentId) {
        await tx.appointment.update({
          where: { id: data.appointmentId },
          data: { status: 'COMPLETED' },
        });

        // Set queue position to completed if any
        await tx.queueItem.updateMany({
          where: { appointmentId: data.appointmentId },
          data: { status: 'COMPLETED' },
        });

        await tx.appointmentStatusHistory.create({
          data: {
            appointmentId: data.appointmentId,
            status: 'COMPLETED',
            changedById: creatorUserId,
            notes: 'Completed via clinical consultation entry',
          },
        });
      }

      // Audit Log entry
      await tx.auditLog.create({
        data: {
          userId: creatorUserId,
          action: 'MEDICAL_RECORD_CREATE',
          entity: 'MedicalRecord',
          entityId: record.id,
          newValue: `Recorded consultation for patient ID: ${data.patientId}`,
        },
      });

      return record;
    });
  }

  static async getLabOrders(query: { doctorId?: string; patientId?: string; status?: string }) {
    const { doctorId, patientId, status } = query;
    const whereClause: any = {};

    if (doctorId) whereClause.doctorId = doctorId;
    if (patientId) whereClause.patientId = patientId;
    if (status) whereClause.status = status;

    return prisma.labOrder.findMany({
      where: whereClause,
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        results: {
          include: {
            technician: { select: { firstName: true, lastName: true } },
            verifier: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { orderDate: 'desc' },
    });
  }

  static async updateLabResult(
    id: string,
    data: {
      testType: string;
      resultValue: string; // JSON payload of parameters
      unit: string;
      referenceRange: string;
      notes?: string;
      status: string; // "SAMPLE_COLLECTED", "PROCESSING", "COMPLETED"
    },
    technicianId: string
  ) {
    return prisma.$transaction(async (tx) => {
      // Find the order
      const order = await tx.labOrder.findUnique({
        where: { id },
      });

      if (!order) {
        throw new Error('Lab order not found');
      }

      // Update Order Status
      await tx.labOrder.update({
        where: { id },
        data: { status: data.status },
      });

      // Upsert lab result row
      const existingResult = await tx.labResult.findFirst({
        where: { labOrderId: id },
      });

      let result;
      if (existingResult) {
        result = await tx.labResult.update({
          where: { id: existingResult.id },
          data: {
            resultValue: data.resultValue,
            unit: data.unit,
            referenceRange: data.referenceRange,
            notes: data.notes,
            status: data.status === 'COMPLETED' ? 'DRAFT' : 'DRAFT', // draft until verified by doctor
            technicianId,
          },
        });
      } else {
        result = await tx.labResult.create({
          data: {
            labOrderId: id,
            testType: data.testType,
            resultValue: data.resultValue,
            unit: data.unit,
            referenceRange: data.referenceRange,
            notes: data.notes,
            status: 'DRAFT',
            technicianId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: technicianId,
          action: 'LAB_RESULT_UPDATE',
          entity: 'LabResult',
          entityId: result.id,
          newValue: `Lab Technician updated results for order ${id}. Status: ${data.status}`,
        },
      });

      return result;
    });
  }

  static async verifyLabResult(resultId: string, verifierId: string) {
    const previous = await prisma.labResult.findUnique({ where: { id: resultId } });
    if (!previous) {
      throw new Error('Lab result not found');
    }

    return prisma.$transaction(async (tx) => {
      const result = await tx.labResult.update({
        where: { id: resultId },
        data: {
          status: 'VERIFIED',
          verifierId,
          verifiedAt: new Date(),
        },
      });

      // Update parent lab order to completed if not already
      await tx.labOrder.update({
        where: { id: result.labOrderId },
        data: { status: 'COMPLETED' },
      });

      await tx.auditLog.create({
        data: {
          userId: verifierId,
          action: 'LAB_RESULT_VERIFY',
          entity: 'LabResult',
          entityId: resultId,
          newValue: 'Doctor verified lab result values',
        },
      });

      return result;
    });
  }
}
