import AppError from '../utils/AppError.js';
import Tenant from '../models/Tenant.js';

const tenantResolver = async (req, res, next) => {
  try {
    let tenantId = req.headers['x-tenant-id'] || req.headers['x-tenant-name'];

    // If tenant name is passed, resolve it to an ID
    if (tenantId && !tenantId.match(/^[0-9a-fA-F]{24}$/)) {
      const tenant = await Tenant.findOne({ name: tenantId });
      if (!tenant) {
        return next(new AppError(`Tenant '${tenantId}' not found`, 404, 'TENANT_NOT_FOUND'));
      }
      tenantId = tenant._id.toString();
    }

    // Fallback to JWT context if decoded by auth middleware
    if (!tenantId && req.user && req.user.tenantId) {
      tenantId = req.user.tenantId.toString();
    }

    if (tenantId) {
      req.tenantId = tenantId;
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default tenantResolver;
