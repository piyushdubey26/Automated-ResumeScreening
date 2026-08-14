import prisma from '../config/db';

export class AdmissionService {
  static async getBeds() {
    return prisma.bed.findMany({
      include: {
        room: {
          include: { ward: true },
        },
        admissions: {
          where: { status: 'ADMITTED' },
          include: {
            patient: true,
            doctor: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
      orderBy: { bedNumber: 'asc' },
    });
  }

  static async admitPatient(
    data: {
      patientId: string;
      doctorId: string;
      bedId: string;
      admissionReason: string;
    },
    creatorUserId: string
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Verify Bed availability
      const bed = await tx.bed.findUnique({
        where: { id: data.bedId },
      });

      if (!bed || bed.status !== 'AVAILABLE') {
        throw new Error('Selected bed is not available or occupied');
      }

      // 2. Mark Bed as Occupied
      await tx.bed.update({
        where: { id: data.bedId },
        data: { status: 'OCCUPIED' },
      });

      // 3. Create Admission Record
      const admission = await tx.admission.create({
        data: {
          patientId: data.patientId,
          doctorId: data.doctorId,
          bedId: data.bedId,
          admissionReason: data.admissionReason,
          status: 'ADMITTED',
        },
      });

      // 4. Create Medical Record
      await tx.medicalRecord.create({
        data: {
          patientId: data.patientId,
          doctorId: data.doctorId,
          type: 'ADMISSION',
          summary: `Patient admitted to room. Reason: ${data.admissionReason}`,
        },
      });

      // 5. Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: creatorUserId,
          action: 'ADMISSION_CREATE',
          entity: 'Admission',
          entityId: admission.id,
          newValue: `Patient ID ${data.patientId} admitted to bed ${bed.bedNumber}`,
        },
      });

      return admission;
    });
  }

  static async dischargePatient(
    admissionId: string,
    data: {
      dischargeSummary: string;
      dischargeInstructions: string;
    },
    creatorUserId: string
  ) {
    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission || admission.status !== 'ADMITTED') {
      throw new Error('No active admission found for this ID');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Mark Bed as Available
      await tx.bed.update({
        where: { id: admission.bedId },
        data: { status: 'AVAILABLE' },
      });

      // 2. Create Discharge entry
      const discharge = await tx.discharge.create({
        data: {
          admissionId,
          dischargeSummary: data.dischargeSummary,
          dischargeInstructions: data.dischargeInstructions,
          dischargedById: creatorUserId,
        },
      });

      // 3. Update Admission status
      const updatedAdmission = await tx.admission.update({
        where: { id: admissionId },
        data: {
          status: 'DISCHARGED',
          dischargeDate: new Date(),
        },
      });

      // 4. Create Medical Record event
      await tx.medicalRecord.create({
        data: {
          patientId: admission.patientId,
          doctorId: admission.doctorId,
          type: 'ADMISSION', // clinical event
          summary: `Patient discharged from ward. Summary: ${data.dischargeSummary}`,
        },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          userId: creatorUserId,
          action: 'ADMISSION_DISCHARGE',
          entity: 'Admission',
          entityId: admissionId,
          newValue: 'Patient discharged and bed released',
        },
      });

      return updatedAdmission;
    });
  }
}
