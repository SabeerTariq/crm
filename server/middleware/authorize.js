// server/middleware/authorize.js
const db = require('../db');

/**
 * authorize(module, action)
 * Example: authorize('leads', 'create')
 */
function authorize(module, action) {
  return async function (req, res, next) {
    try {
      // Check if user has admin role (role_id = 1)
      if (req.user?.role_id === 1) return next();

      // Check if user has a role assigned
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      // Get user's role_id from token
      const roleId = req.user?.role_id;
      if (!roleId) {
        return res.status(403).json({ message: 'No role assigned' });
      }

      const sql = `
        SELECT 1 FROM role_permissions rp
        JOIN permissions p ON p.id = rp.permission_id
        WHERE rp.role_id = ? AND p.module = ? AND p.action = ?
        LIMIT 1
      `;
      db.query(sql, [roleId, module, action], (err, okRows) => {
        if (err) return res.status(500).json(err);
        if (!okRows.length) {
          return res.status(403).json({ message: 'Forbidden: missing permission' });
        }
        next();
      });
    } catch (e) {
      return res.status(500).json(e);
    }
  };
}

module.exports = authorize;
