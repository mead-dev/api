const { validationResult } = require('express-validator/check');

const Product = require('../../models/product');
const Notification = require('../../models/notification');
const User = require('../../models/user');
const clearImage = require('../../shared/clearImage');

exports.index = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).populate('roleId');
        let products;

        if (user.roleId.name === 'Commerçant') products = await Product.find({ userId: req.userId }, null, { sort: { createdAt: -1 } }).populate('userId');
        else products = await Product.find(null, null, { sort: { createdAt: -1 } }).populate('userId');

        res.status(200).json({ products });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.store = async (req, res, next) => {
    try {
        const { title, description, price, size, color, brand, delivery, quantity } = req.body;
        const userId = req.userId;
        const user = await User.findById(userId);

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
        const imageUrl = req.file.path;

        const product = new Product({ title, description, price, imageUrl, userId, size, color, brand, delivery, quantity });
        await product.save();

        const notification = new Notification({ type: 'Product', data: product, userId: user });
        await notification.save();

        const users = await User.find();
        await Promise.all(users.map(async u => {
            if (u.communities.includes(userId)) {
                u.notifications.push({ notification });
                await u.save();
            }
        }));

        if (user.roleId.name) products = await Product.find({ userId: req.userId }, null, { sort: { createdAt: -1 } }).populate('userId');
        else products = await Product.find(null, null, { sort: { createdAt: -1 } }).populate('userId');

        res.status(201).json({ products });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.edit = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const user = await User.findById(req.userId).populate('roleId');
        let product;
        if (user.roleId.name === 'Commerçant') product = await Product.findOne({ _id: productId, userId: req.userId });
        else product = await Product.findById(productId);

        res.status(200).json({ product });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { title, description, price, size, color, brand, delivery, quantity } = req.body;
        const user = await User.findById(req.userId).populate('roleId');
        let product;
        if (user.roleId.name === 'Commerçant') product = await Product.findOne({ _id: productId, userId: req.userId });
        else product = await Product.findById(productId);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error('La validation a échoué.');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        product.title = title;
        product.description = description;
        product.price = price;
        product.quantity = quantity;
        if (req.file) {
            clearImage(product.imageUrl);
            product.imageUrl = req.file.path;
        }
        if (size) product.size = size;
        if (color) product.color = color;
        if (brand) product.brand = brand;
        if (delivery) product.delivery = delivery != "null" ? delivery : 0;

        await product.save();

        let products;
        if (user.roleId.name) products = await Product.find({ userId: req.userId }, null, { sort: { createdAt: -1 } }).populate('userId');
        else products = await Product.find(null, null, { sort: { createdAt: -1 } }).populate('userId');

        res.status(201).json({ products });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.destroy = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const user = await User.findById(req.userId).populate('roleId');
        let product;
        if (user.roleId.name) product = await Product.findOne({ _id: productId, userId: req.userId });
        else product = await Product.findById(productId);

        clearImage(product.imageUrl);
        await product.remove();

        let products;
        if (user.roleId.name) products = await Product.find({ userId: req.userId }, null, { sort: { createdAt: -1 } }).populate('userId');
        else products = await Product.find(null, null, { sort: { createdAt: -1 } }).populate('userId');

        res.status(201).json({ products });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};