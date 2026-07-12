import bcrypt from 'bcryptjs';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import logger from './logger.js';

export const bootstrapAdmin = async () => {
  try {
    const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
    const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
    const tenantName = process.env.ADMIN_BOOTSTRAP_TENANT_NAME;

    if (!email || !password || !tenantName) {
      logger.info('Admin bootstrap parameters not fully configured. Skipping bootstrap seeding.');
      return;
    }

    // Resolve or create Tenant
    let tenant = await Tenant.findOne({ name: tenantName });
    if (!tenant) {
      tenant = new Tenant({ name: tenantName });
      await tenant.save();
      logger.info(`Bootstrap tenant '${tenantName}' created.`);
    }

    // Check if user already exists
    let adminUser = await User.findOne({ tenantId: tenant._id, email });
    if (!adminUser) {
      const passwordHash = await bcrypt.hash(password, 12);
      adminUser = new User({
        tenantId: tenant._id,
        name: 'Bootstrap Admin',
        email,
        passwordHash,
        role: 'Admin',
        status: 'Active',
      });
      await adminUser.save();
      logger.info(`Bootstrap Admin account created for email '${email}'.`);
    } else {
      logger.info(`Bootstrap Admin account for email '${email}' already exists. Skipping.`);
    }
  } catch (error) {
    logger.error('Error during Admin bootstrap seeding:', error);
  }
};
