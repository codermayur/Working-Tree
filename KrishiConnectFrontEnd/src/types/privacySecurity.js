/**
 * Types / interfaces for Privacy & Security feature.
 * Use JSDoc for IDE support; no TypeScript dependency.
 */

/**
 * @typedef {Object} PrivacySettings
 * @property {boolean} twoFactorEnabled - Two-factor authentication enabled
 * @property {boolean} activityStatusEnabled - Show last active to connections
 */

/**
 * @typedef {Object} BlockedUser
 * @property {string} id - User id (backend may use _id; we normalize to id)
 * @property {string} name - Display name
 * @property {string} [avatar] - Avatar URL
 * @property {string} blockedAt - ISO date string or relative label
 */

/**
 * @typedef {Object} PrivacySettingsPayload
 * @property {boolean} [twoFactorEnabled]
 * @property {boolean} [activityStatusEnabled]
 */

export default {};
