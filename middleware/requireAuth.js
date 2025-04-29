const jwt = require('jsonwebtoken');
const User = require('../modules/userModel');

const requireAuth = async (req, res, next) => {
    // verify authentication
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authorization.split(' ')[1];

    try {
        const { _id } = jwt.verify(token, process.env.SECRET);

        const user = await User.findOne({ _id }).select('_id email role');

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({ error: 'Request is not authorized' });
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.role) {
        return res.status(401).json({ error: 'Unauthorized. User or role not found.' });
    }
    
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Admin or Superadmin access required' });
    }
    next();
};

const requireSuperAdmin = (req, res, next) => {
    if (!req.user || !req.user.role) {
        return res.status(401).json({ error: 'Unauthorized. User or role not found.' });
    }
    
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Super Admin access required' });
    }
    next();
};


module.exports = { requireAuth, requireAdmin, requireSuperAdmin };