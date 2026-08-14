import prisma from '../config/db';

export class PatientService {
  static async getPatients(query: { search?: string; gender?: string; bloodGroup?: string }) {
    const { search, gender, bloodGroup } = query;

    const whereClause: any = {
      status: 'ACTIVE',
    };

    if (gender) {
      whereClause.gender = gender;
    }

    if (bloodGroup) {
      whereClause.bloodGroup = bloodGroup;
    }

    if (search) {
      whereClause.OR = [
        { patientId: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.patient.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createPatient(data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    gender: string;
    dateOfBirth: string;
    bloodGroup?: string;
    allergies?: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    address?: string;
    medicalHistory?: string;
    currentMedications?: string;
    creatorUserId?: string;
  }) {
    // Generate patient ID
    const count = await prisma.patient.count();
    const patientId = `PAT-2026-${String(1001 + count).padStart(4, '0')}`;

    const patient = await prisma.patient.create({
      data: {
        patientId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone,
        gender: data.gender,
        dateOfBirth: new Date(data.dateOfBirth),
        bloodGroup: data.bloodGroup || null,
        allergies: data.allergies || 'None',
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        address: data.address || null,
        medicalHistory: data.medicalHistory || null,
        currentMedications: data.currentMedications || null,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: data.creatorUserId || null,
        action: 'PATIENT_CREATE',
        entity: 'Patient',
        entityId: patient.id,
        newValue: `Receptionist/Admin registered patient: ${patientId}`,
      },
    });

    return patient;
  }

  static async updatePatient(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      gender: string;
      dateOfBirth: string;
      bloodGroup: string;
      allergies: string;
      emergencyContactName: string;
      emergencyContactPhone: string;
      address: string;
      medicalHistory: string;
      currentMedications: string;
    }>,
    updaterUserId?: string
  ) {
    const previous = await prisma.patient.findUnique({ where: { id } });
    if (!previous) {
      throw new Error('Patient not found');
    }

    const updateData: any = { ...data };
    if (data.dateOfBirth) {
      updateData.dateOfBirth = new Date(data.dateOfBirth);
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: updaterUserId || null,
        action: 'PATIENT_UPDATE',
        entity: 'Patient',
        entityId: id,
        previousValue: JSON.stringify(previous),
        newValue: JSON.stringify(patient),
      },
    });

    return patient;
  }

  static async getPatientProfile(id: string) {
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Retrieve longitudinal clinical items to build a chronological timeline
    const appointments = await prisma.appointment.findMany({
      where: { patientId: id },
      include: {
        doctor: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        department: true,
      },
      orderBy: { date: 'desc' },
    });

    const medicalRecords = await prisma.medicalRecord.findMany({
      where: { patientId: id },
      include: {
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        vitals: true,
        diagnoses: true,
      },
      orderBy: { date: 'desc' },
    });

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: id },
      include: {
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        items: {
          include: { medicine: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const labOrders = await prisma.labOrder.findMany({
      where: { patientId: id },
      include: {
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
      orderBy: { createdAt: 'desc' },
    });

    const admissions = await prisma.admission.findMany({
      where: { patientId: id },
      include: {
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        bed: {
          include: {
            room: {
              include: { ward: true },
            },
          },
        },
        discharge: {
          include: {
            dischargedBy: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { admissionDate: 'desc' },
    });

    const invoices = await prisma.invoice.findMany({
      where: { patientId: id },
      include: {
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const documents = await prisma.document.findMany({
      where: { patientId: id },
      include: {
        uploadedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Assemble unified chronological clinical history timeline
    const timelineEvents: any[] = [];

    appointments.forEach((a) => {
      timelineEvents.push({
        id: a.id,
        type: 'APPOINTMENT',
        date: a.date,
        title: `Appointment with Dr. ${a.doctor.user.firstName} ${a.doctor.user.lastName}`,
        status: a.status,
        description: `Department: ${a.department.name}. Reason: ${a.reason || 'N/A'}. Slot: ${a.timeSlot}`,
        metadata: { status: a.status, type: a.type },
      });
    });

    medicalRecords.forEach((mr) => {
      timelineEvents.push({
        id: mr.id,
        type: 'CONSULTATION',
        date: mr.date,
        title: `Consultation - Dr. ${mr.doctor.user.firstName} ${mr.doctor.user.lastName}`,
        status: 'COMPLETED',
        description: mr.summary || 'Clinical diagnosis and review.',
        metadata: {
          symptoms: mr.symptoms,
          clinicalNotes: mr.clinicalNotes,
          vitals: mr.vitals,
          diagnoses: mr.diagnoses,
        },
      });
    });

    prescriptions.forEach((p) => {
      timelineEvents.push({
        id: p.id,
        type: 'PRESCRIPTION',
        date: p.createdAt,
        title: `Prescription Issued`,
        status: p.status,
        description: `Issued by Dr. ${p.doctor.user.firstName} ${p.doctor.user.lastName}`,
        metadata: { items: p.items },
      });
    });

    labOrders.forEach((lo) => {
      timelineEvents.push({
        id: lo.id,
        type: 'LAB_ORDER',
        date: lo.orderDate,
        title: `Lab Test Ordered: ${lo.results[0]?.testType || 'Laboratory Panel'}`,
        status: lo.status,
        description: `Requested by Dr. ${lo.doctor.user.firstName} ${lo.doctor.user.lastName}. Notes: ${lo.notes || 'None'}`,
        metadata: { status: lo.status, results: lo.results },
      });
    });

    admissions.forEach((ad) => {
      timelineEvents.push({
        id: ad.id,
        type: 'ADMISSION',
        date: ad.admissionDate,
        title: `Inpatient Admission`,
        status: ad.status,
        description: `Admitted under Dr. ${ad.doctor.user.firstName} ${ad.doctor.user.lastName}. Ward: ${ad.bed.room.ward.name}, Bed: ${ad.bed.bedNumber}`,
        metadata: {
          reason: ad.admissionReason,
          discharge: ad.discharge,
        },
      });
    });

    // Sort timeline by date descending
    timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      patient,
      timeline: timelineEvents,
      billing: invoices,
      documents,
    };
  }
}
