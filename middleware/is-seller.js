const User = require('../models/user');

module.exports = async (req, res, next) => {
    const user = await User.findById(req.userId).populate('roleId');
    if (!['Commerçant', 'Administrateur'].includes(user.roleId.name)) {
        const error = new Error('Vous n\'êtes pas un commerçant.');
        error.statusCode = 500;
        throw error;
    }
    next();
}