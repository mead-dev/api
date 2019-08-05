const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const io = require('../socket');
const User = require('../models/user');
const Role = require('../models/role');
const Message = require('../models/message');
const Notification = require('../models/notification');

exports.signup = async (req, res, next) => {
    const { email, name, password, password_confirmation, roleId, phone } = req.body;

    try {
        const errors = validationResult(req);
        if (!errors.isEmpty() || password !== password_confirmation) {
            const error = new Error('La validation a échoué.');
            error.statusCode = 422;
            error.data = errors.array();
            if (password !== password_confirmation) error.data.push('Le mot de passe et sa confirmation sont différents');
            throw error;
        }
        if (!req.file) {
            const error = new Error('Aucune image.');
            error.statusCode = 422;
            throw error;
        }
        const photo = req.file.path;

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({ email, name, password: hashedPassword, roleId, photo, phone });
        const result = await user.save();
        res.status(201).json({
            message: 'Utilisateur créé.',
            userId: result._id,
            name,
            email,
            password: hashedPassword,
            photo,
            phone
        });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getSignup = async (req, res, next) => {
    try {
        const roles = await Role.find();
        const sendable = roles.filter(role => ['Classique', 'Commerçant'].includes(role.name));

        res.status(200).json({ roles: sendable });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).populate('roleId');
        const notifications = [];
        await Promise.all(user.notifications.map(async ({ notification }) => {
            const item = await Notification.findById(notification).populate('userId');
            notifications.push(item);
        }));
        if (!user) {
            const error = new Error('Aucun utilisateur avec cette adresse mail n\'a été trouvé.');
            error.statusCode = 401;
            throw error;
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('Mot de passe erroné.');
            error.statusCode = 401;
            throw error;
        }
        const token = jwt.sign(
            {
                userId: user._id.toString()
            },
            'somesupersecretsecretbybrainer21',
            { expiresIn: '12h' }
        );
        res.status(200).json({
            token,
            userId: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.roleId.name,
            cart: user.cart.items,
            photo: user.photo,
            phone: user.phone,
            communities: user.communities,
            notifications
        });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.profile = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).populate('roleId');
        const notifications = [];
        await Promise.all(user.notifications.map(async ({ notification }) => {
            const item = await Notification.findById(notification).populate('userId');
            notifications.push(item);
        }));

        res.status(200).json({
            name: user.name,
            email: user.email,
            role: user.roleId.name,
            userId: user._id,
            photo: user.photo,
            phone: user.phone,
            communities: user.communities,
            notifications
        });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.editProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).populate('roleId');
        const notifications = [];
        await Promise.all(user.notifications.map(async ({ notification }) => {
            const item = await Notification.findById(notification).populate('userId');
            notifications.push(item);
        }))
        const { name, email, phone } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error('La validation a échoué.');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        user.name = name;
        user.email = email;
        user.phone = phone;
        if (req.file) user.photo = req.file.path;

        await user.save();

        res.status(201).json({
            name: user.name,
            email: user.email,
            role: user.roleId.name,
            userId: user._id,
            photo: user.photo,
            phone: user.phone,
            communities: user.communities,
            notifications
        });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.editPassword = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).populate('roleId');
        const notifications = [];
        await Promise.all(user.notifications.map(async ({ notification }) => {
            const item = await Notification.findById(notification).populate('userId');
            notifications.push(item);
        }));
        const { newPassword, confirmedNewPassword, phone } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty() || newPassword !== confirmedNewPassword) {
            const error = new Error('La validation a échoué.');
            error.statusCode = 422;
            error.data = errors.array();
            if (newPassword !== confirmedNewPassword) error.data.push('Le nouveau mot de passe et sa confirmation sont différents');
            throw error;
        }

        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('Mot de passe erroné.');
            error.statusCode = 401;
            throw error;
        } else {
            if (newPassword && newPassword.length >= 8) {
                const hashedPassword = bcrypt.hash(newPassword);
                user.password = hashedPassword;
            }

            await user.save();
        }
        res.status(201).json({
            name: user.name,
            email: user.email,
            role: user.roleId.name,
            userId: user._id,
            photo: user.photo,
            phone: user.phone,
            communities: user.communities,
            notifications
        });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.joinCommunity = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(req.userId).populate('roleId');
        const notifications = [];
        await Promise.all(user.notifications.map(async ({ notification }) => {
            const item = await Notification.findById(notification).populate('userId');
            notifications.push(item);
        }));
        if (!user.communities.includes(userId)) {
            user.communities.push(userId);
            await user.save();
        }
        res.status(201).json({
            profile: {
                name: user.name,
                email: user.email,
                role: user.roleId.name,
                userId: user._id,
                photo: user.photo,
                phone: user.phone,
                communities: user.communities,
                notifications
            }
        });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.quitCommunity = async (req, res, next) => {
    const { userId } = req.params;
    const user = await User.findById(req.userId).populate('roleId');
    const notifications = [];
    await Promise.all(user.notifications.map(async ({ notification }) => {
        const item = await Notification.findById(notification).populate('userId');
        notifications.push(item);
    }));
    if (user.communities.includes(userId)) {
        const communities = user.communities.filter(community => community !== userId);
        user.communities = communities;
        await user.save();
    }
    res.status(201).json({
        profile: {
            name: user.name,
            email: user.email,
            role: user.roleId.name,
            userId: user._id,
            photo: user.photo,
            phone: user.phone,
            communities: user.communities,
            notifications
        }
    });
};

exports.sendMessage = async (req, res, next) => {
    const { content, communityId } = req.body;
    const newMessage = new Message({ content, communityId, userId: req.userId });
    await newMessage.save();
    const message = await Message.findById(newMessage._id).populate('userId');
    io.getIO().emit('message', {
        action: 'new',
        message
    });
    res.status(201).json(true);
};