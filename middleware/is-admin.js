const User = require('../models/user');

module.exports = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).populate('roleId');
        if (user.roleId.name !== 'Administrateur') {
            const error = new Error('Vous n\'êtes pas administrateur.');
            error.statusCode = 500;
            throw error;
        }   
    } catch (error) {
        next(error);
    }
    next();
}