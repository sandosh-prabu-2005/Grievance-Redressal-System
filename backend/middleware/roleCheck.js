module.exports.isAdmin = function(req, res, next) {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Admin access required' });
    }
  };
  
  module.exports.isStudent = function(req, res, next) {
    if (req.user && req.user.role === 'student') {
      next();
    } else {
      res.status(403).json({ message: 'Student access required' });
    }
  };
  