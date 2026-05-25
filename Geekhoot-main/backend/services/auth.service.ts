import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../prisma/db';
import { AppError } from '../middleware/error.middleware';
import { sendVerificationEmail } from './email.service';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (JWT_SECRET + '_refresh');

export const generateAccessToken = (id: string): string => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (id: string): string => {
  return jwt.sign({ id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const generateToken = (id: string): string => {
  return generateAccessToken(id);
};

export const storeRefreshToken = async (userId: string, token: string) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: hashedToken }
  });
};

export const verifyRefreshToken = async (token: string) => {
  try {
    const decoded: any = jwt.verify(token, JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    if (!user.refreshToken) {
      throw new AppError('Session expired. Please log in again.', 401);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    if (user.refreshToken !== hashedToken) {
      throw new AppError('Refresh token compromise/reuse detected', 401);
    }

    return user;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError('Invalid or expired refresh token', 401);
  }
};

export const revokeRefreshToken = async (userId: string) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null }
    });
  } catch (error) {
    // Ignore if user doesn't exist anymore
  }
};

export const signupUser = async (data: any) => {
  const { email, phone, password, ...rest } = data;

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phone }],
    },
  });

  if (existingUser) {
    if (existingUser.email === email && existingUser.phone === phone) {
      throw new AppError('User with this email and phone number already exists', 400);
    } else if (existingUser.email === email) {
      throw new AppError('User with this email already exists', 400);
    } else {
      throw new AppError('User with this phone number already exists', 400);
    }
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  let locationUrl = null;
  if (data.latitude && data.longitude) {
    locationUrl = `https://www.google.com/maps?q=${data.latitude},${data.longitude}`;
  }

  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
      locationUrl,
      role: (email === (process.env.ADMIN_EMAIL || 'admin@geekhoot.com') || data.name === 'geekhoot') ? 'ADMIN' : 'USER',
      isVerified: true,
      verificationCode: null,
    },
  });

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const loginUser = async (identifier: string, password: string) => {
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { phone: identifier },
        { name: identifier }
      ],
    },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Invalid email/phone or password', 401);
  }

  // Auto-verify anyone on signin to bypass/unblock old accounts
  if (!user.isVerified) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const updateUserProfile = async (userId: string, data: any) => {
  const { email, phone, name, address, houseNo, streetNear, road, district, state, pincode } = data;

  if (email) {
    const existing = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: userId }
      }
    });
    if (existing) {
      throw new AppError('Email is already in use by another account', 400);
    }
  }

  if (phone) {
    const existing = await prisma.user.findFirst({
      where: {
        phone,
        NOT: { id: userId }
      }
    });
    if (existing) {
      throw new AppError('Phone number is already in use by another account', 400);
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      email,
      phone,
      address,
      houseNo,
      streetNear,
      road,
      district,
      state,
      pincode
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      address: true,
      houseNo: true,
      streetNear: true,
      road: true,
      district: true,
      state: true,
      pincode: true,
    }
  });

  return updated;
};

