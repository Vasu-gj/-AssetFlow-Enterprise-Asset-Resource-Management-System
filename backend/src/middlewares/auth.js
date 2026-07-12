import { verifyAccessToken } from '../utils/token.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required. Missing token.', 401, 'UNAUTHORIZED'));
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Token expired.', 401, 'TOKEN_EXPIRED'));
      }
      return next(new AppError('Invalid token.', 401, 'INVALID_TOKEN'));
    }

    // Verify user exists and is active
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', 401, 'USER_NOT_FOUND'));
    }

    if (user.status !== 'Active') {
      return next(new AppError('Your account has been deactivated.', 403, 'USER_DEACTIVATED'));
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export default auth;
