import AppError from '../utils/AppError.js';

const validate = (schema, target = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed; // Re-bind parsed and sanitized data (stripping unknown keys)
      next();
    } catch (err) {
      const details = {};
      if (err.errors) {
        err.errors.forEach((e) => {
          const path = e.path.join('.');
          details[path] = e.message;
        });
      }
      next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', details));
    }
  };
};

export default validate;
