import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ALL_PERMISSIONS = [
  { name: 'patients.read', description: 'Read patient records' },
  { name: 'patients.create', description: 'Create new patient records' },
  { name: 'patients.update', description: 'Update existing patient records' },
  { name: 'patients.delete', description: 'Soft delete/deactivate patient records' },
  { name: 'appointments.read', description: 'Read appointment list and schedules' },
  { name: 'appointments.create', description: 'Book new appointments' },
  { name: 'appointments.update', description: 'Reschedule or update appointments' },
  { name: 'appointments.delete', description: 'Cancel/delete appointments' },
  { name: 'medical_records.read', description: 'View longitudinal medical records' },
  { name: 'medical_records.write', description: 'Write clinical notes and diagnoses' },
  { name: 'prescriptions.create', description: 'Issue drug prescriptions' },
  { name: 'prescriptions.read', description: 'Read prescriptions' },
  { name: 'lab_orders.manage', description: 'Create and update lab test orders' },
  { name: 'lab_results.write', description: 'Enter and verify lab test results' },
  { name: 'lab_results.read', description: 'View laboratory results' },
  { name: 'pharmacy.manage', description: 'Manage pharmacy stocks and batch details' },
  { name: 'pharmacy.read', description: 'Read medicine inventory' },
  { name: 'users.manage', description: 'Manage hospital staff users' },
  { name: 'audit_logs.read', description: 'View security audit logs' },
  { name: 'queue.manage', description: 'Call patients and update check-in queues' },
  { name: 'queue.read', description: 'View active queue status' },
  { name: 'beds.manage', description: 'Allocate beds and manage ward states' },
  { name: 'beds.read', description: 'View ward occupancy details' },
  { name: 'billing.manage', description: 'Create and update billing invoices' },
  { name: 'billing.read', description: 'View invoices and transactions' },
];

async function main() {
  console.log('Starting seed script...');

  console.log('Cleaning up database...');
  await prisma.auditLog.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversationParticipant.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.discharge.deleteMany({});
  await prisma.admission.deleteMany({});
  await prisma.bed.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.ward.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.prescriptionItem.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.labResult.deleteMany({});
  await prisma.labOrder.deleteMany({});
  await prisma.diagnosis.deleteMany({});
  await prisma.vital.deleteMany({});
  await prisma.medicalRecord.deleteMany({});
  await prisma.queueItem.deleteMany({});
  await prisma.appointmentStatusHistory.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.doctorAvailability.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.nurse.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});

  const saltRounds = 10;
  const commonPasswordHash = await bcrypt.hash('password123', saltRounds);

  // 1. Seed Permissions
  console.log('Seeding Permissions...');
  const permissionsMap = new Map<string, string>();
  for (const perm of ALL_PERMISSIONS) {
    const dbPerm = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    permissionsMap.set(perm.name, dbPerm.id);
  }

  // 2. Seed Roles
  console.log('Seeding Roles and linking Permissions...');
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Full system control' },
    { name: 'DOCTOR', description: 'Consultations, prescription, diagnosis' },
    { name: 'NURSE', description: 'Vitals tracking, bed assignments' },
    { name: 'RECEPTIONIST', description: 'Demographics, appointments, check-ins, billing' },
    { name: 'LAB_STAFF', description: 'Process lab tests, input values' },
    { name: 'PHARMACIST', description: 'Manage medicine inventory and dispensing' },
    { name: 'PATIENT', description: 'Patient portal access' },
  ];

  const roleDbMap = new Map<string, any>();
  for (const r of roles) {
    const dbRole = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
    roleDbMap.set(r.name, dbRole);
  }

  // Define role permission linkages
  const rolePermissions: Record<string, string[]> = {
    SUPER_ADMIN: ALL_PERMISSIONS.map(p => p.name),
    DOCTOR: [
      'patients.read',
      'appointments.read',
      'appointments.update',
      'medical_records.read',
      'medical_records.write',
      'prescriptions.create',
      'prescriptions.read',
      'lab_orders.manage',
      'lab_results.read',
      'queue.read',
      'queue.manage',
      'beds.read',
    ],
    NURSE: [
      'patients.read',
      'medical_records.read',
      'medical_records.write', // recording vitals/notes
      'beds.read',
      'beds.manage',
      'queue.read',
    ],
    RECEPTIONIST: [
      'patients.read',
      'patients.create',
      'patients.update',
      'appointments.read',
      'appointments.create',
      'appointments.update',
      'queue.manage',
      'queue.read',
      'billing.manage',
      'billing.read',
      'beds.read',
    ],
    LAB_STAFF: [
      'patients.read',
      'lab_orders.manage',
      'lab_results.write',
      'lab_results.read',
    ],
    PHARMACIST: [
      'patients.read',
      'pharmacy.manage',
      'pharmacy.read',
      'prescriptions.read',
    ],
    PATIENT: [
      'patients.read',
      'appointments.create',
      'appointments.read',
      'prescriptions.read',
      'lab_results.read',
      'billing.read',
    ],
  };

  // Clear existing role permissions link to avoid conflicts on re-seeding
  await prisma.rolePermission.deleteMany({});
  for (const roleName of Object.keys(rolePermissions)) {
    const roleId = roleDbMap.get(roleName).id;
    const permNames = rolePermissions[roleName];
    for (const pName of permNames) {
      const permissionId = permissionsMap.get(pName);
      if (permissionId) {
        await prisma.rolePermission.create({
          data: { roleId, permissionId }
        });
      }
    }
  }

  // 3. Seed Departments
  console.log('Seeding Departments...');
  const departments = [
    { name: 'Cardiology', code: 'CARDIO', description: 'Heart and cardiovascular system care' },
    { name: 'Pediatrics', code: 'PEDIATRICS', description: 'Infant, child, and adolescent healthcare' },
    { name: 'Orthopedics', code: 'ORTHO', description: 'Musculoskeletal system injuries and surgeries' },
    { name: 'General Medicine', code: 'GEN_MEDICINE', description: 'Primary outpatient checkups and care' },
    { name: 'Neurology', code: 'NEURO', description: 'Brain, spinal cord, and nerve disorders' },
    { name: 'Dermatology', code: 'DERMA', description: 'Skin, nails, and hair conditions' },
  ];
  const deptDbMap = new Map<string, any>();
  for (const dept of departments) {
    const dbDept = await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
    deptDbMap.set(dept.code, dbDept);
  }

  // 4. Seed Wards, Rooms, and Beds
  console.log('Seeding Wards, Rooms, and Beds...');
  const wardsData = [
    { name: 'General Inpatient Ward', type: 'GENERAL', floor: 1, capacity: 10 },
    { name: 'Intensive Care Unit (ICU)', type: 'ICU', floor: 2, capacity: 5 },
    { name: 'Emergency Observation Ward', type: 'EMERGENCY', floor: 1, capacity: 6 },
  ];
  
  for (const wData of wardsData) {
    const ward = await prisma.ward.upsert({
      where: { name: wData.name },
      update: {},
      create: wData,
    });

    // Create 2 rooms in each ward
    for (let r = 1; r <= 2; r++) {
      const roomNo = `${wData.floor}0${r}`;
      const room = await prisma.room.upsert({
        where: { roomNumber: roomNo },
        update: {},
        create: {
          wardId: ward.id,
          roomNumber: roomNo,
          type: wData.type,
          capacity: Math.floor(wData.capacity / 2),
        },
      });

      // Create Beds
      const numBeds = room.capacity;
      for (let b = 1; b <= numBeds; b++) {
        const bedNo = `B-${roomNo}-${b}`;
        await prisma.bed.upsert({
          where: { bedNumber: bedNo },
          update: {},
          create: {
            roomId: room.id,
            bedNumber: bedNo,
            type: wData.type === 'ICU' ? 'ICU' : 'STANDARD',
            status: 'AVAILABLE',
          },
        });
      }
    }
  }

  // 5. Seed Suppliers & Medicines & Inventory
  console.log('Seeding Pharmacy Inventory...');
  const supplier = await prisma.supplier.create({
    data: {
      name: 'Global Pharma Distributors',
      contactPerson: 'John Miller',
      email: 'sales@globalpharma.com',
      phone: '+1-555-0199',
      address: '742 Evergreen Terrace, Medical District',
    },
  });

  const medicinesData = [
    { name: 'Paracetamol 500mg', genericName: 'Acetaminophen', sku: 'MED-PARA-500', brand: 'Tylenol', category: 'Analgesic', type: 'TABLET', strength: '500mg', unitPrice: 0.10, isPrescriptionRequired: false },
    { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin Trihydrate', sku: 'MED-AMOX-500', brand: 'Moxatag', category: 'Antibiotic', type: 'CAPSULE', strength: '500mg', unitPrice: 0.35, isPrescriptionRequired: true },
    { name: 'Atorvastatin 20mg', genericName: 'Atorvastatin Calcium', sku: 'MED-ATOR-20', brand: 'Lipitor', category: 'Lipid-lowering agent', type: 'TABLET', strength: '20mg', unitPrice: 0.80, isPrescriptionRequired: true },
    { name: 'Metformin 500mg', genericName: 'Metformin Hydrochloride', sku: 'MED-METF-500', brand: 'Glucophage', category: 'Antidiabetic', type: 'TABLET', strength: '500mg', unitPrice: 0.25, isPrescriptionRequired: true },
    { name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', sku: 'MED-IBUP-400', brand: 'Advil', category: 'NSAID', type: 'TABLET', strength: '400mg', unitPrice: 0.15, isPrescriptionRequired: false },
    { name: 'Cetirizine 10mg', genericName: 'Cetirizine Dihydrochloride', sku: 'MED-CETI-10', brand: 'Zyrtec', category: 'Antihistamine', type: 'TABLET', strength: '10mg', unitPrice: 0.20, isPrescriptionRequired: false },
    { name: 'Omeprazole 20mg', genericName: 'Omeprazole', sku: 'MED-OMEP-20', brand: 'Prilosec', category: 'Proton Pump Inhibitor', type: 'CAPSULE', strength: '20mg', unitPrice: 0.40, isPrescriptionRequired: true },
    { name: 'Amlodipine 5mg', genericName: 'Amlodipine Besylate', sku: 'MED-AMLO-5', brand: 'Norvasc', category: 'Calcium Channel Blocker', type: 'TABLET', strength: '5mg', unitPrice: 0.30, isPrescriptionRequired: true },
  ];

  const medicineDbMap = new Map<string, any>();
  for (const medData of medicinesData) {
    const med = await prisma.medicine.upsert({
      where: { sku: medData.sku },
      update: {},
      create: medData,
    });
    medicineDbMap.set(med.sku, med);

    // Create a batch in stock
    const isLow = medData.sku === 'MED-AMLO-5';
    const isExpired = medData.sku === 'MED-CETI-10';
    const isExpiringSoon = medData.sku === 'MED-OMEP-20';

    let quantity = 250;
    let expiry = new Date('2028-12-31');
    let batch = 'B2026001';
    let status = 'IN_STOCK';

    if (isLow) {
      quantity = 8;
      status = 'LOW_STOCK';
    } else if (isExpired) {
      quantity = 100;
      expiry = new Date('2026-05-15'); // expired
      batch = 'B2025005';
      status = 'EXPIRED';
    } else if (isExpiringSoon) {
      quantity = 150;
      expiry = new Date('2026-08-30'); // next month (relative to current date 2026-08-10)
      batch = 'B2026022';
      status = 'LOW_STOCK'; // low-stock / soon to expire
    }

    await prisma.inventory.upsert({
      where: { medicineId_batchNumber: { medicineId: med.id, batchNumber: batch } },
      update: {},
      create: {
        medicineId: med.id,
        batchNumber: batch,
        quantity,
        expiryDate: expiry,
        supplierId: supplier.id,
        status,
      },
    });
  }

  // 6. Seed Super Admin User
  console.log('Seeding Admin user...');
  const adminRole = roleDbMap.get('SUPER_ADMIN');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hms.com' },
    update: {},
    create: {
      email: 'admin@hms.com',
      passwordHash: commonPasswordHash,
      firstName: 'Albus',
      lastName: 'Dumbledore',
      roleId: adminRole.id,
    },
  });

  // 7. Seed Doctors (10)
  console.log('Seeding Doctors...');
  const docRole = roleDbMap.get('DOCTOR');
  const docDetails = [
    { email: 'geller@hms.com', first: 'Monica', last: 'Geller', spec: 'Cardiology', qual: 'MD, FACC', code: 'CARDIO', fee: 150.0, room: 'R-101' },
    { email: 'house@hms.com', first: 'Gregory', last: 'House', spec: 'General Medicine', qual: 'MD, Board Certified', code: 'GEN_MEDICINE', fee: 200.0, room: 'R-102' },
    { email: 'grey@hms.com', first: 'Meredith', last: 'Grey', spec: 'Orthopedics', qual: 'MD, FACS', code: 'ORTHO', fee: 180.0, room: 'R-103' },
    { email: 'shepherd@hms.com', first: 'Derek', last: 'Shepherd', spec: 'Neurology', qual: 'MD, PhD', code: 'NEURO', fee: 250.0, room: 'R-104' },
    { email: 'wilson@hms.com', first: 'James', last: 'Wilson', spec: 'General Medicine', qual: 'MD', code: 'GEN_MEDICINE', fee: 120.0, room: 'R-105' },
    { email: 'bailey@hms.com', first: 'Miranda', last: 'Bailey', spec: 'Pediatrics', qual: 'MD, FAAP', code: 'PEDIATRICS', fee: 130.0, room: 'R-106' },
    { email: 'chase@hms.com', first: 'Robert', last: 'Chase', spec: 'Cardiology', qual: 'MD', code: 'CARDIO', fee: 140.0, room: 'R-107' },
    { email: 'foreman@hms.com', first: 'Eric', last: 'Foreman', spec: 'Neurology', qual: 'MD', code: 'NEURO', fee: 210.0, room: 'R-108' },
    { email: 'cameron@hms.com', first: 'Allison', last: 'Cameron', spec: 'Dermatology', qual: 'MD', code: 'DERMA', fee: 110.0, room: 'R-109' },
    { email: 'cuddy@hms.com', first: 'Lisa', last: 'Cuddy', spec: 'Pediatrics', qual: 'MD', code: 'PEDIATRICS', fee: 160.0, room: 'R-110' },
  ];

  const doctorsList: any[] = [];
  for (let i = 0; i < docDetails.length; i++) {
    const detail = docDetails[i];
    const user = await prisma.user.upsert({
      where: { email: detail.email },
      update: {},
      create: {
        email: detail.email,
        passwordHash: commonPasswordHash,
        firstName: detail.first,
        lastName: detail.last,
        roleId: docRole.id,
      },
    });

    const doc = await prisma.doctor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        employeeId: `DOC-${1000 + i}`,
        departmentId: deptDbMap.get(detail.code).id,
        specialization: detail.spec,
        qualification: detail.qual,
        experienceYears: 5 + i * 2,
        consultationFee: detail.fee,
        roomNumber: detail.room,
      },
    });
    doctorsList.push(doc);

    // Seed Availability (Mon-Fri, 9:00 - 17:00)
    for (let day = 1; day <= 5; day++) {
      await prisma.doctorAvailability.create({
        data: {
          doctorId: doc.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          maxAppointments: 12,
          slotDurationMinutes: 30,
        },
      });
    }
  }

  // 8. Seed Nurses (5)
  console.log('Seeding Nurses...');
  const nurseRole = roleDbMap.get('NURSE');
  const nurseDetails = [
    { email: 'hathaway@hms.com', first: 'Carol', last: 'Hathaway', code: 'GEN_MEDICINE', qual: 'BSN, RN' },
    { email: 'nightingale@hms.com', first: 'Florence', last: 'Nightingale', code: 'CARDIO', qual: 'MSN, RN' },
    { email: 'jack@hms.com', first: 'Jackie', last: 'Peyton', code: 'ORTHO', qual: 'RN' },
    { email: 'carla@hms.com', first: 'Carla', last: 'Espinosa', code: 'NEURO', qual: 'BSN' },
    { email: 'rachel@hms.com', first: 'Rachel', last: 'Green', code: 'DERMA', qual: 'RN' },
  ];

  for (let i = 0; i < nurseDetails.length; i++) {
    const detail = nurseDetails[i];
    const user = await prisma.user.upsert({
      where: { email: detail.email },
      update: {},
      create: {
        email: detail.email,
        passwordHash: commonPasswordHash,
        firstName: detail.first,
        lastName: detail.last,
        roleId: nurseRole.id,
      },
    });

    await prisma.nurse.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        employeeId: `NUR-${2000 + i}`,
        departmentId: deptDbMap.get(detail.code).id,
        qualification: detail.qual,
      },
    });
  }

  // 9. Seed Receptionists (5), Lab Techs (3), Pharmacists (3)
  console.log('Seeding Staff roles...');
  const staffRoles = [
    { role: 'RECEPTIONIST', count: 5, emails: ['pam@hms.com', 'jim@hms.com', 'dwight@hms.com', 'angela@hms.com', 'toby@hms.com'] },
    { role: 'LAB_STAFF', count: 3, emails: ['dexter@hms.com', 'walter@hms.com', 'jesse@hms.com'] },
    { role: 'PHARMACIST', count: 3, emails: ['phila@hms.com', 'morty@hms.com', 'rick@hms.com'] },
  ];

  const labTechUsers: any[] = [];
  for (const s of staffRoles) {
    const roleId = roleDbMap.get(s.role).id;
    for (let i = 0; i < s.emails.length; i++) {
      const email = s.emails[i];
      const nameParts = email.split('@')[0];
      const firstName = nameParts.charAt(0).toUpperCase() + nameParts.slice(1);
      
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          passwordHash: commonPasswordHash,
          firstName,
          lastName: 'Staff',
          roleId,
        },
      });

      const st = await prisma.staff.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          employeeId: `STF-${s.role.substring(0, 3)}-${1000 + i}`,
          roleType: s.role,
        },
      });
      if (s.role === 'LAB_STAFF') {
        labTechUsers.push(user);
      }
    }
  }

  // 10. Seed Patients (50+)
  console.log('Seeding Patients (50+)...');
  const patientRole = roleDbMap.get('PATIENT');
  const genders = ['MALE', 'FEMALE', 'OTHER'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const allergyList = ['Penicillin', 'Peanuts', 'Sulfa drugs', 'Aspirin', 'None', 'Shellfish', 'Pollen'];

  const patientsList: any[] = [];
  const patientFirstNames = [
    'John', 'Jane', 'Robert', 'Mary', 'Michael', 'David', 'James', 'Patricia', 'Jennifer', 'Linda',
    'Elizabeth', 'Barbara', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony',
    'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George',
    'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas', 'Eric',
    'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle', 'Laura', 'Sarah', 'Kimberly', 'Deborah',
    'Jessica', 'Shirley', 'Cynthia', 'Angela', 'Melissa', 'Brenda', 'Amy', 'Anna'
  ];
  const patientLastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson',
    'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White',
    'Lopez', 'Lee', 'Gonzalez', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Perez', 'Hall',
    'Young', 'Allen', 'Sanchez', 'Wright', 'King', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson',
    'Hill', 'Ramirez', 'Campbell', 'Mitchell', 'Roberts', 'Carter', 'Phillips', 'Evans'
  ];

  for (let i = 0; i < 55; i++) {
    const first = patientFirstNames[i % patientFirstNames.length];
    const last = patientLastNames[i % patientLastNames.length];
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${100 + i}@gmail.com`;
    const gender = genders[i % 3];
    const bg = bloodGroups[i % 8];
    const allergy = i % 5 === 0 ? allergyList[i % allergyList.length] : 'None';
    
    // Create patient user (for portals) for the first 10, others are just patient records
    let userRecord: any = null;
    if (i < 10) {
      userRecord = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          passwordHash: commonPasswordHash,
          firstName: first,
          lastName: last,
          roleId: patientRole.id,
        },
      });
    }

    const birthYear = 1960 + (i % 45);
    const dob = new Date(`${birthYear}-05-${(i % 25) + 1}`);

    const patient = await prisma.patient.create({
      data: {
        userId: userRecord ? userRecord.id : null,
        patientId: `PAT-2026-${String(1000 + i).padStart(4, '0')}`,
        firstName: first,
        lastName: last,
        email,
        phone: `+1-555-${String(10000 + i * 17).substring(0, 4)}-${String(10000 + i * 29).substring(0, 4)}`,
        gender,
        dateOfBirth: dob,
        bloodGroup: bg,
        allergies: allergy,
        emergencyContactName: `${last} Emergency Contact`,
        emergencyContactPhone: `+1-555-9000-${i}`,
        address: `${100 + i} Clinical Way, Suite ${i}`,
        medicalHistory: i % 4 === 0 ? 'Hypertension, Mild Asthma' : 'No major chronic conditions',
        currentMedications: i % 4 === 0 ? 'Lisinopril 10mg once daily' : 'None',
      },
    });
    patientsList.push(patient);
  }

  // 11. Seed Appointments, Status History & Queue
  console.log('Seeding Appointments & Active Queue...');
  const apptStatuses = ['COMPLETED', 'COMPLETED', 'SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED', 'NO_SHOW'];
  
  // Create 45 historical appointments (last 30 days) and some today/future ones
  const todayStr = '2026-08-10';
  const today = new Date(todayStr);

  for (let i = 0; i < 50; i++) {
    const patient = patientsList[i];
    const doctor = doctorsList[i % doctorsList.length];
    const deptId = doctor.departmentId;

    let apptDate = new Date(today);
    let status = apptStatuses[i % apptStatuses.length];
    let timeSlot = '10:00';

    if (i < 30) {
      // Historical: last 30 days
      const daysAgo = 30 - i;
      apptDate.setDate(today.getDate() - daysAgo);
      status = 'COMPLETED'; // past are completed
      timeSlot = `${String(9 + (i % 6)).padStart(2, '0')}:30`;
    } else if (i < 40) {
      // Future
      const daysAhead = i - 29;
      apptDate.setDate(today.getDate() + daysAhead);
      status = 'SCHEDULED';
      timeSlot = `${String(10 + (i % 4)).padStart(2, '0')}:00`;
    } else {
      // Today appointments
      status = i % 2 === 0 ? 'CHECKED_IN' : 'WAITING';
      timeSlot = `${String(11 + (i - 40)).padStart(2, '0')}:30`;
    }

    // Ensure unique slot constraint in seeding
    let appt: any = null;
    try {
      appt = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          departmentId: deptId,
          date: apptDate,
          timeSlot,
          type: i % 5 === 0 ? 'FOLLOWUP' : 'OUTPATIENT',
          status,
          reason: 'General checkup and consultation.',
          notes: 'Routine health parameter evaluation.',
        },
      });
    } catch (e) {
      // Slot collision, adjust timeSlot and retry
      appt = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          departmentId: deptId,
          date: apptDate,
          timeSlot: `${timeSlot.split(':')[0]}:${String(parseInt(timeSlot.split(':')[1]) + 15)}`,
          type: 'OUTPATIENT',
          status,
          reason: 'Alternative slot booking',
        },
      });
    }

    // Appointment Status History
    await prisma.appointmentStatusHistory.create({
      data: {
        appointmentId: appt.id,
        status: 'SCHEDULED',
        changedById: adminUser.id,
        notes: 'Initial booking',
        createdAt: new Date(appt.createdAt.getTime() - 24 * 60 * 60 * 1000),
      },
    });

    if (status !== 'SCHEDULED') {
      await prisma.appointmentStatusHistory.create({
        data: {
          appointmentId: appt.id,
          status,
          changedById: adminUser.id,
          notes: `Status updated to ${status}`,
          createdAt: appt.createdAt,
        },
      });
    }

    // Queue system for today's checked-in/waiting appointments
    if (status === 'CHECKED_IN' || status === 'WAITING') {
      const qPos = i - 39;
      await prisma.queueItem.create({
        data: {
          appointmentId: appt.id,
          tokenNumber: 100 + qPos,
          queuePosition: qPos,
          status: status === 'CHECKED_IN' ? 'WAITING' : 'WAITING',
          estimatedWaitingTimeMinutes: qPos * 20,
        },
      });
    }

    // 12. Seed Clinical Data for Completed Appointments
    if (status === 'COMPLETED') {
      const medicalRecord = await prisma.medicalRecord.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          appointmentId: appt.id,
          type: 'CONSULTATION',
          date: apptDate,
          summary: 'Patient presented for routine checkup. General parameters are within limits.',
          clinicalNotes: 'Heart and lung sounds clear. Checked reflexes. Prescribed medication.',
          symptoms: 'Mild headaches and seasonal allergy symptoms.',
        },
      });

      // Vitals
      await prisma.vital.create({
        data: {
          medicalRecordId: medicalRecord.id,
          patientId: patient.id,
          bloodPressure: `${110 + (i % 20)}/${70 + (i % 15)}`,
          heartRate: 70 + (i % 15),
          temperature: 98.4 + (i % 10) * 0.1,
          spo2: 98 + (i % 2),
          respiratoryRate: 14 + (i % 4),
          weight: 60.5 + (i % 30),
          recordedById: patient.userId || adminUser.id,
          recordedAt: apptDate,
        },
      });

      // Diagnosis
      await prisma.diagnosis.create({
        data: {
          medicalRecordId: medicalRecord.id,
          code: i % 2 === 0 ? 'I10' : 'J30.9',
          description: i % 2 === 0 ? 'Essential (primary) hypertension' : 'Allergic rhinitis, unspecified',
          type: 'PRIMARY',
          status: 'ACTIVE',
          diagnosedAt: apptDate,
        },
      });

      // Prescription
      const paraMedicine = medicineDbMap.get('MED-PARA-500');
      const prescription = await prisma.prescription.create({
        data: {
          medicalRecordId: medicalRecord.id,
          patientId: patient.id,
          doctorId: doctor.id,
          appointmentId: appt.id,
          status: i % 3 === 0 ? 'DISPENSED' : 'ACTIVE',
          createdAt: apptDate,
        },
      });

      await prisma.prescriptionItem.create({
        data: {
          prescriptionId: prescription.id,
          medicineId: paraMedicine.id,
          dosage: '500mg',
          frequency: 'PRN (As needed)',
          duration: '3 days',
          instructions: 'Take 1 tablet every 6 hours if headache persists',
        },
      });

      // Lab Order & Results for some patients
      if (i % 4 === 0) {
        const labOrder = await prisma.labOrder.create({
          data: {
            patientId: patient.id,
            doctorId: doctor.id,
            appointmentId: appt.id,
            medicalRecordId: medicalRecord.id,
            status: 'COMPLETED',
            notes: 'Check Lipid Profile panel.',
            orderDate: apptDate,
          },
        });

        // Seed Lab Result
        const techUser = labTechUsers[i % labTechUsers.length];
        await prisma.labResult.create({
          data: {
            labOrderId: labOrder.id,
            testType: 'LIPID',
            resultValue: JSON.stringify({
              cholesterol: '210 mg/dL',
              triglycerides: '155 mg/dL',
              hdl: '45 mg/dL',
              ldl: '134 mg/dL',
            }),
            unit: 'mg/dL',
            referenceRange: 'Cholesterol < 200, HDL > 40, LDL < 100',
            status: 'VERIFIED',
            technicianId: techUser.id,
            verifierId: doctor.userId,
            verifiedAt: apptDate,
            notes: 'Slightly elevated LDL cholesterol level.',
          },
        });
      }

      // Billing - Invoice
      const invoiceNumber = `INV-2026-${String(2000 + i)}`;
      const consultationFee = doctor.consultationFee;
      const labFee = i % 4 === 0 ? 50.0 : 0.0;
      const medicineFee = paraMedicine.unitPrice * 10;
      const totalAmount = consultationFee + labFee + medicineFee;
      const taxAmount = totalAmount * 0.1; // 10% tax
      const payableAmount = totalAmount + taxAmount;

      const invoice = await prisma.invoice.create({
        data: {
          patientId: patient.id,
          appointmentId: appt.id,
          invoiceNumber,
          totalAmount,
          discountAmount: 0.0,
          taxAmount,
          payableAmount,
          status: i % 5 === 0 ? 'UNPAID' : 'PAID',
          dueDate: new Date(apptDate.getTime() + 15 * 24 * 60 * 60 * 1000),
          createdAt: apptDate,
        },
      });

      // Invoice Items
      await prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          name: 'Doctor Consultation Fee',
          category: 'CONSULTATION',
          quantity: 1,
          unitPrice: consultationFee,
          amount: consultationFee,
        },
      });

      if (labFee > 0) {
        await prisma.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            name: 'Lipid Profile Lab Test',
            category: 'LAB_TEST',
            quantity: 1,
            unitPrice: labFee,
            amount: labFee,
          },
        });
      }

      await prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          name: 'Paracetamol 500mg',
          category: 'MEDICINE',
          quantity: 10,
          unitPrice: paraMedicine.unitPrice,
          amount: medicineFee,
        },
      });

      // If PAID, seed a Payment record
      if (invoice.status === 'PAID') {
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: payableAmount,
            paymentMethod: i % 2 === 0 ? 'CARD' : 'UPI',
            paymentStatus: 'COMPLETED',
            transactionReference: `TXN-${100000 + i}`,
            paidAt: apptDate,
            notes: 'Payment settled in full.',
          },
        });
      }
    }
  }

  // 13. Audit logs seeding
  console.log('Seeding Audit logs...');
  const auditLogs = [
    { action: 'USER_LOGIN', entity: 'User', userId: adminUser.id, desc: 'Admin login successful' },
    { action: 'PATIENT_CREATE', entity: 'Patient', userId: adminUser.id, desc: 'Created patient demographic files' },
    { action: 'PRESCRIPTION_CREATE', entity: 'Prescription', userId: doctorsList[0].userId, desc: 'Issued new prescription item' },
    { action: 'INVOICE_GENERATE', entity: 'Invoice', userId: adminUser.id, desc: 'Billed patient consultation' },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({
      data: {
        userId: log.userId,
        action: log.action,
        entity: log.entity,
        newValue: log.desc,
        clientIp: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    });
  }

  console.log('Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    pool.end();
  });
