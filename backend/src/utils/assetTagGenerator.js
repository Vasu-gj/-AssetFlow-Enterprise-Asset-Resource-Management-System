import Counter from '../models/Counter.js';

export const generateAssetTag = async (tenantId) => {
  const counter = await Counter.findOneAndUpdate(
    { tenantId, model: 'Asset', field: 'assetTag' },
    { $inc: { count: 1 } },
    { new: true, upsert: true }
  );

  const paddedCount = String(counter.count).padStart(4, '0');
  return `AF-${paddedCount}`;
};
