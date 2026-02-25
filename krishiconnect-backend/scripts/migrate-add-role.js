/**
 * One-time migration: set default role 'farmer' for existing users that don't have a valid role.
 * Safe to run multiple times (idempotent for users that already have role set).
 *
 * Usage: from backend root, with .env loaded:
 *   node scripts/migrate-add-role.js
 *
 * Or: MONGODB_URI=... node scripts/migrate-add-role.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is required. Set it in .env or environment.');
  process.exit(1);
}

const VALID_ROLES = ['admin', 'farmer', 'expert'];

async function run() {
  await mongoose.connect(MONGODB_URI);
  const coll = mongoose.connection.collection('users');

  const result = await coll.updateMany(
    {
      $or: [
        { role: { $exists: false } },
        { role: null },
        { role: { $nin: VALID_ROLES } },
      ],
    },
    { $set: { role: 'farmer' } }
  );

  console.log('Migration complete:', {
    matched: result.matchedCount,
    modified: result.modifiedCount,
  });

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
