# Role-Based Access Control (RBAC)

## Overview

- **Roles:** `admin`, `farmer`, `expert`
- **Default role:** `farmer` (for new and migrated users)
- **Authority:** Backend only. Frontend may use `user.role` for UI hints; all enforcement is on the server.

## User Schema

- `role`: String, enum `['admin', 'farmer', 'expert']`, default `'farmer'`, indexed.
- `expertDetails.isVerifiedExpert`: Boolean; when true, an admin has verified this expert (admin approval workflow).

## Authorization Middleware

- **`authorizeRoles(...roles)`** — Use after `authenticate`. Allows request only if `req.user.role` is one of the given roles. Returns 403 otherwise.
- **`requireAdmin`** — Shorthand for `authorizeRoles('admin')`.
- **`requireExpertOrAdmin`** — Shorthand for `authorizeRoles('admin', 'expert')`.

Example:

```js
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles, requireAdmin } = require('../middlewares/authorizeRoles');

router.post('/admin-only', authenticate, requireAdmin, controller);
router.get('/expert-or-admin', authenticate, authorizeRoles('admin', 'expert'), controller);
```

## Authentication Flow

- `authenticate` loads the user from the database using the JWT `userId`. Role comes from the stored user document, never from the client.
- JWT payload remains `{ userId }`; role is not required in the token because every request fetches the user and thus gets the current role.

## Route Protection Rules (Examples)

| Role   | Examples |
|--------|----------|
| Admin  | Manage users, change roles, verify experts, list users, access analytics |
| Expert | Provide verified answers, access expert tools (use `authorizeRoles('admin', 'expert')` or `requireExpertOrAdmin`) |
| Farmer | Basic platform usage; default role |

Do not hardcode permissions in controllers; use middleware.

## Preventing Role Escalation

1. **Profile update:** `PATCH /users/me` (updateProfile) uses an allowlist of fields. `role` is not in the allowlist and is explicitly stripped, so users cannot change their own role via profile update.
2. **Role change endpoint:** Only `PATCH /api/v1/admin/users/:userId/role` can set a user’s role. It is protected by `authenticate` + `requireAdmin`.
3. **Validation:** Role value is validated with the same enum as the schema (`ROLES` in `config/constants.js`).
4. **Audit:** Role changes are logged (target user, previous/new role, performing admin).

## Admin API (all require admin role)

- `GET /api/v1/admin/users` — List users (query: `page`, `limit`, `role`, `q`).
- `PATCH /api/v1/admin/users/:userId/role` — Set user role. Body: `{ "role": "admin"|"farmer"|"expert" }`.
- `PATCH /api/v1/admin/users/:userId/verify-expert` — Set `expertDetails.isVerifiedExpert = true` for an expert user.

## Migration

For existing users without a role, run once:

```bash
node scripts/migrate-add-role.js
```

This sets `role: 'farmer'` for any user where `role` is missing, null, or not in the enum. Safe to run multiple times.

## Scalability

- **New roles:** Add the value to the User schema enum and to `ROLES` in `config/constants.js`. Use `authorizeRoles('newRole', ...)` where needed.
- **New permissions:** Add new middleware or reuse `authorizeRoles` with the right role set. Keep authorization in middleware, not inside controllers.
- **Multiple roles per route:** Pass multiple roles: `authorizeRoles('admin', 'expert')`.

## Security Summary

- Role is never trusted from the client; it is always read from the DB in `authenticate`.
- JWT is verified; user is loaded from DB each request.
- No privilege escalation: profile update cannot set role; only admin-only endpoint can.
- No direct DB manipulation via public endpoints; role changes go through the validated admin API.
