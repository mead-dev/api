const { validationResult } = require('express-validator/check');

const Role = require('../../models/role');

exports.index = async (req, res, next) => {
    try {
        const roles = await Role.find(null, null, { sort: { createdAt: -1 } });

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
        const { name } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error('La validation a échoué.');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const role = new Role({ name });
        await role.save();

        const roles = await Role.find(null, null, { sort: { createdAt: -1 } });

        res.status(201).json({ roles });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.edit = async (req, res, next) => {
    try {
        const { roleId } = req.params;
        const role = await Role.findById(roleId);

        res.status(200).json({ role });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const { roleId } = req.params;
        const { name } = req.body;
        const role = await Role.findById(roleId);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error('La validation a échoué.');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        role.name = name;

        await role.save();

        const roles = await Role.find(null, null, { sort: { createdAt: -1 } });

        res.status(201).json({ roles });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.destroy = async (req, res, next) => {
    try {
        const { roleId } = req.params;
        const role = Role.findById(roleId);

        await role.remove();

        const roles = await Role.find(null, null, { sort: { createdAt: -1 } });

        res.status(201).json({ roles });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};