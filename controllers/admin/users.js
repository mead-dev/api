const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');

const User = require('../../models/user');
const Role = require('../../models/role');
const clearImage = require('../../shared/clearImage');

exports.index = async (req, res, next) => {
    try {
        const users = await User.find(null, null, { sort: { createdAt: -1 } }).populate('roleId');

        res.status(200).json({ users });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const roles = await Role.find();

        res.status(200).json({ roles });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.store = async (req, res, next) => {
    try {
        const { email, name, roleId, password, phone } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error('La validation a échoué.');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }
        if (!req.file) {
            const error = new Error('Aucune image.');
            error.statusCode = 422;
            throw error;
        }
        const photo = req.file.path;

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({ email, name, password: hashedPassword, roleId, phone, photo });
        await user.save();

        const users = await User.find(null, null, { sort: { createdAt: -1 } }).populate('roleId');

        res.status(201).json({ users });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.edit = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        res.status(200).json({ user });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { email, name, roleId, phone } = req.body;
        const user = await User.findById(userId);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error('La validation a échoué.');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        user.name = name;
        user.email = email;
        user.roleId = roleId;
        user.phone = phone;
        if (req.file) {
            if (user.photo) clearImage(user.photo);
            user.photo = req.file.path;
        }

        await user.save();

        const users = await User.find(null, null, { sort: { createdAt: -1 } }).populate('roleId');

        res.status(201).json({ users });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.destroy = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = User.findById(userId);

        if (user.photo) clearImage(user.photo);
        await user.remove();

        const users = await User.find(null, null, { sort: { createdAt: -1 } }).populate('roleId');

        res.status(201).json({ users });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};