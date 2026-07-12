import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import AppError from '../utils/AppError.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token.js';

export const signup = async (req, res, next) => {
  try {
    const { name, email, password, tenantName } = req.body;

    // Resolve or create Tenant
    let tenant = await Tenant.findOne({ name: tenantName });
    if (!tenant) {
      tenant = new Tenant({ name: tenantName });
      await tenant.save();
    }

    // Check if email already registered in this tenant
    const existingUser = await User.findOne({ tenantId: tenant._id, email });
    if (existingUser) {
      return next(new AppError('Email is already registered under this tenant.', 409, 'EMAIL_ALREADY_IN_USE'));
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with default role 'Employee' (ignores any client role input)
    const user = new User({
      tenantId: tenant._id,
      name,
      email,
      passwordHash,
      role: 'Employee',
      status: 'Active',
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Account registered successfully. Please log in.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { tenantId } = req; // Injected by tenantResolver header parser if available

    // Find user within this tenant or generally if tenant resolver didn't run
    const filter = { email };
    if (tenantId) {
      filter.tenantId = tenantId;
    }

    const user = await User.findOne(filter);
    if (!user) {
      return next(new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
    }

    if (user.status !== 'Active') {
      return next(new AppError('Account is deactivated. Please contact your administrator.', 403, 'ACCOUNT_DEACTIVATED'));
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return next(new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      data: {
        token: accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          departmentId: user.department,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return next(new AppError('Refresh token missing.', 401, 'REFRESH_TOKEN_MISSING'));
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return next(new AppError('Invalid or expired refresh token.', 401, 'INVALID_REFRESH_TOKEN'));
    }

    const user = await User.findById(decoded.id);
    if (!user || user.status !== 'Active') {
      return next(new AppError('User not found or deactivated.', 401, 'USER_UNAUTHORIZED'));
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Rotate refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: {
        token: newAccessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};
