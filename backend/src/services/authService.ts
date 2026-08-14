import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../utils/auth';

export class AuthService {
  static async registerPatient(data: {
    email: string;
    passwordHash: string; // password sent in clear, we hash it here
    firstName: string;
    lastName: string;
    phone: string;
    gender: string;
    dateOfBirth: string;
    bloodGroup?: string;
    allergies?: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    address?: string;
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Resolve Patient Role
    const patientRole = await prisma.role.findUnique({
      where: { name: 'PATIENT' },
    });

    if (!patientRole) {
      throw new Error('Patient role not found. Run database seed first.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.passwordHash, salt);

    // Create user and patient profile inside a database transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          roleId: patientRole.id,
        },
      });

      // Generate Patient readable ID
      const count = await tx.patient.count();
      const patientId = `PAT-2026-${String(1001 + count).padStart(4, '0')}`;

      const patient = await tx.patient.create({
        data: {
          userId: user.id,
          patientId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          gender: data.gender,
          dateOfBirth: new Date(data.dateOfBirth),
          bloodGroup: data.bloodGroup,
          allergies: data.allergies,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          address: data.address,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'PATIENT_REGISTER',
          entity: 'Patient',
          entityId: patient.id,
          newValue: `Patient registered via portal. ID: ${patientId}`,
        },
      });

      return { user, patient };
    });

    const payload: TokenPayload = {
      userId: result.user.id,
      role: 'PATIENT',
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: 'PATIENT',
        patientId: result.patient.patientId,
        patientDbId: result.patient.id,
      },
      accessToken,
      refreshToken,
    };
  }

  static async login(email: string, passwordPlain: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        patient: true,
        doctor: true,
      },
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid email or inactive user account');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const payload: TokenPayload = {
      userId: user.id,
      role: user.role.name,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Audit Log login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entity: 'User',
        entityId: user.id,
        newValue: `User logged in. Role: ${user.role.name}`,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        patientId: user.patient?.patientId || null,
        patientDbId: user.patient?.id || null,
        doctorId: user.doctor?.id || null,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refresh(token: string) {
    // Verified payload
    const decoded = jwtVerifyRefresh(token);
    
    // Check if user is still active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new Error('User is inactive or no longer exists');
    }

    const payload: TokenPayload = {
      userId: user.id,
      role: user.role.name,
    };

    const newAccessToken = generateAccessToken(payload);
    return { accessToken: newAccessToken };
  }
}

// Internal helper to wrap verifyRefreshToken with custom errors
function jwtVerifyRefresh(token: string): TokenPayload {
  try {
    const decoded = verifyRefreshToken(token);
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}
import { verifyRefreshToken } from '../utils/auth';
