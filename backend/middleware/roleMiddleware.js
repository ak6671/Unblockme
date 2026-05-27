module.exports = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Access denied: No administrative profile found.' });
    }

    const hasPermission = allowedRoles.includes(req.admin.role);
    if (!hasPermission) {
      return res.status(403).json({ 
        error: `Access denied: Insufficient permissions for role ${req.admin.role}.` 
      });
    }

    next();
  };
};
