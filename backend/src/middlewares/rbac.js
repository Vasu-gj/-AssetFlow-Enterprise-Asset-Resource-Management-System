import AppError from '../utils/AppError.js';

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new AppError('Forbidden: Insufficient privileges', 403, 'FORBIDDEN'));
    }
    next();
  };
};

export const requireDepartmentOrScope = () => {
  return (req, res, next) => {
    const { role, departmentId } = req.user;
    if (role === 'Admin' || role === 'AssetManager') {
      return next(); // Admins and AssetManagers have global scope
    }

    const targetDeptId = req.params.deptId || req.body.department || req.query.department;
    if (role === 'DepartmentHead' && departmentId && departmentId.toString() === targetDeptId) {
      return next();
    }

    return next(new AppError('Unauthorized scope access.', 403, 'UNAUTHORIZED_SCOPE'));
  };
};
