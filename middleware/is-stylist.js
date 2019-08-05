const User = require('../models/user');

module.exports = async (req, res, next) => {
    const user = await User.findById(req.userId).populate('roleId');
    if (user.roleId.name !== 'Styliste') {
        const error = new Error('Vous n\'êtes pas un styliste.');
        error.statusCode = 500;
        throw error;
    }
    next();
}