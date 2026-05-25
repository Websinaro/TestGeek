import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import prisma from "../prisma/db";
import { sendVerificationEmail } from "../services/email.service";
import { z } from "zod";
import jwt from "jsonwebtoken";

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(8),
  address: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie("token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = signupSchema.parse(req.body);
    const user = await authService.signupUser(validatedData);
    
    const token = authService.generateAccessToken(user.id);
    const refreshToken = authService.generateRefreshToken(user.id);
    await authService.storeRefreshToken(user.id, refreshToken);
    
    setAuthCookies(res, token, refreshToken);
    return res.status(201).json({
      message: "User created successfully",
      user,
      token,
    });
  } catch (error: any) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { identifier, password } = req.body;

  try {
    const user = await authService.loginUser(identifier, password);
    
    const token = authService.generateAccessToken(user.id);
    const refreshToken = authService.generateRefreshToken(user.id);
    await authService.storeRefreshToken(user.id, refreshToken);
    
    setAuthCookies(res, token, refreshToken);

    res.json({
      message: "Logged in successfully",
      user,
      token,
    });
  } catch (error: any) {
    next(error);
  }
};

export const verifyCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: "Email and verification code are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.json({ message: "Account is already verified" });
    }

    if (user.verificationCode !== code.toString().trim()) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Verify user
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        verificationCode: null
      }
    });

    // Automatically log in on verification!
    const token = authService.generateAccessToken(updatedUser.id);
    const refreshToken = authService.generateRefreshToken(updatedUser.id);
    await authService.storeRefreshToken(updatedUser.id, refreshToken);
    
    setAuthCookies(res, token, refreshToken);

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      message: "Email verified successfully!",
      user: userWithoutPassword,
      token
    });
  } catch (error: any) {
    next(error);
  }
};

export const resendCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account is already verified" });
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.user.update({
      where: { email },
      data: { verificationCode: newCode }
    });

    await sendVerificationEmail(user.email, user.name, newCode);

    res.json({
      message: "A fresh verification code has been dispatched to your email address."
    });
  } catch (error: any) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || ((process.env.JWT_SECRET || 'default_secret') + '_refresh'));
      if (decoded && decoded.id) {
        await authService.revokeRefreshToken(decoded.id);
      }
    }
  } catch (err) {
    // Ignore verification/decoding errors on logout
  }

  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
  });
  res.cookie("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
  });
  res.json({ message: "Logged out successfully" });
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is missing" });
    }

    const user = await authService.verifyRefreshToken(refreshToken);
    const newAccessToken = authService.generateAccessToken(user.id);
    const newRefreshToken = authService.generateRefreshToken(user.id);

    await authService.storeRefreshToken(user.id, newRefreshToken);
    setAuthCookies(res, newAccessToken, newRefreshToken);

    const { password: _, refreshToken: __, ...userWithoutPassword } = user;

    res.json({
      message: "Token refreshed successfully",
      token: newAccessToken,
      user: userWithoutPassword
    });
  } catch (error: any) {
    // Clear cookies upon failed verification to prevent cookie-replay loops
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
    });
    res.cookie("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
    });
    next(error);
  }
};

export const getMe = async (req: any, res: Response) => {
  res.json({ user: req.user });
};

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  address: z.string().optional(),
  houseNo: z.string().optional(),
  streetNear: z.string().optional(),
  road: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

export const updateProfile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const validatedData = updateProfileSchema.parse(req.body);
    const updated = await authService.updateUserProfile(req.user.id, validatedData);
    res.json({
      message: "Profile updated successfully",
      user: updated
    });
  } catch (error: any) {
    next(error);
  }
};

