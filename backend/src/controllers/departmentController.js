import Department from '../models/Department.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

// Check if potentialParentId is a descendant of departmentId
const isDescendant = async (tenantId, departmentId, potentialParentId) => {
  let currentParentId = potentialParentId;
  while (currentParentId) {
    if (currentParentId.toString() === departmentId.toString()) {
      return true;
    }
    const parentDept = await Department.findOne({ tenantId, _id: currentParentId });
    currentParentId = parentDept ? parentDept.parentDepartment : null;
  }
  return false;
};

export const createDepartment = async (req, res, next) => {
  try {
    const { name, parentDepartment, departmentHead, status } = req.body;
    const tenantId = req.user.tenantId;

    // If parent is specified, verify it exists and belongs to the same tenant
    if (parentDepartment) {
      const parent = await Department.findOne({ tenantId, _id: parentDepartment });
      if (!parent) {
        return next(new AppError('Parent department not found.', 404, 'PARENT_DEPARTMENT_NOT_FOUND'));
      }
    }

    // Verify head exists and belongs to the same tenant
    if (departmentHead) {
      const head = await User.findOne({ tenantId, _id: departmentHead });
      if (!head) {
        return next(new AppError('Department head user not found.', 404, 'USER_NOT_FOUND'));
      }
    }

    const department = new Department({
      tenantId,
      name,
      parentDepartment: parentDepartment || null,
      departmentHead: departmentHead || null,
      status: status || 'Active',
    });

    await department.save();

    res.status(201).json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartments = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const departments = await Department.find({ tenantId })
      .populate('parentDepartment', 'name')
      .populate('departmentHead', 'name email');

    res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const department = await Department.findOne({ tenantId, _id: req.params.id })
      .populate('parentDepartment', 'name')
      .populate('departmentHead', 'name email');

    if (!department) {
      return next(new AppError('Department not found.', 404, 'DEPARTMENT_NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const { name, parentDepartment, departmentHead, status } = req.body;
    const tenantId = req.user.tenantId;
    const departmentId = req.params.id;

    const department = await Department.findOne({ tenantId, _id: departmentId });
    if (!department) {
      return next(new AppError('Department not found.', 404, 'DEPARTMENT_NOT_FOUND'));
    }

    // Verify parent is not itself or its descendant (prevent circular reference)
    if (parentDepartment) {
      if (parentDepartment.toString() === departmentId.toString()) {
        return next(new AppError('A department cannot be its own parent.', 409, 'CIRCULAR_REFERENCE'));
      }

      const isCircular = await isDescendant(tenantId, departmentId, parentDepartment);
      if (isCircular) {
        return next(new AppError('Circular parent-department relationship detected.', 409, 'CIRCULAR_REFERENCE'));
      }

      const parent = await Department.findOne({ tenantId, _id: parentDepartment });
      if (!parent) {
        return next(new AppError('Parent department not found.', 404, 'PARENT_DEPARTMENT_NOT_FOUND'));
      }
    }

    if (departmentHead) {
      const head = await User.findOne({ tenantId, _id: departmentHead });
      if (!head) {
        return next(new AppError('Department head user not found.', 404, 'USER_NOT_FOUND'));
      }
    }

    department.name = name || department.name;
    department.parentDepartment = parentDepartment !== undefined ? parentDepartment : department.parentDepartment;
    department.departmentHead = departmentHead !== undefined ? departmentHead : department.departmentHead;
    department.status = status || department.status;

    await department.save();

    res.status(200).json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const departmentId = req.params.id;

    // Check if any employee is in this department
    const employeeExists = await User.findOne({ tenantId, department: departmentId });
    if (employeeExists) {
      return next(new AppError('Cannot delete department because active employees are assigned to it. Deactivate it instead.', 409, 'DEPENDENCY_EXISTS'));
    }

    const deleted = await Department.findOneAndDelete({ tenantId, _id: departmentId });
    if (!deleted) {
      return next(new AppError('Department not found.', 404, 'DEPARTMENT_NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
