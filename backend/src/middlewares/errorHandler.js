import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log all 5xx server errors
  if (err.statusCode >= 500) {
    logger.error(`[500 ERROR] - ${req.method} ${req.originalUrl} - Error: ${err.message}`, {
      stack: err.stack,
      reqBody: req.body,
      user: req.user ? req.user.id : 'unauthenticated',
      tenantId: req.tenantId || 'no-tenant',
    });
  } else {
    logger.warn(`[${err.statusCode} WARN] - ${req.method} ${req.originalUrl} - Error: ${err.message}`, {
      errorCode: err.errorCode,
      details: err.details,
    });
  }

  // Handle Mongoose duplicate key error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const val = err.keyValue[field];
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: `Duplicate value '${val}' for field '${field}'.`,
        details: { field, value: val }
      }
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const details = {};
    for (let field in err.errors) {
      details[field] = err.errors[field].message;
    }
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data.',
        details
      }
    });
  }

  // Send production formatted error
  res.status(err.statusCode).json({
    success: false,
    error: {
      code: err.errorCode || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Something went wrong on our end.',
      details: err.details || null
    }
  });
};

export default errorHandler;
