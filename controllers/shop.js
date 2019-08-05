const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');

const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');
const Message = require('../models/message');

const ITEMS_PER_PAGE = 24;

exports.getProducts = async (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    try {
        const numProducts = await Product.find().countDocuments();
        totalItems = await numProducts;

        const products = await Product.find(null, null, { sort: { createdAt: -1 } }).skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE);
        res.status(200).json({
            products,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
        });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.getProduct = async (req, res, next) => {
    const productId = req.params.productId;

    try {
        const product = await Product.findById(productId).populate('userId');
        res.status(200).json({ product });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.getCart = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).populate('cart.items.productId');

        const products = user.cart.items;
        res.status(200).json({ cart: products });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.postAddCartItem = async (req, res, next) => {
    const productId = req.body.productId;

    try {
        const product = await Product.findById(productId);
        const user = await User.findById(req.userId);

        await user.addToCart(product);
        const updatedUser = await User.findById(req.userId).populate('cart.items.productId');
        res.status(200).json({ cart: updatedUser.cart.items });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.postSubtractCartItem = async (req, res, next) => {
    const productId = req.body.productId;

    try {
        const product = await Product.findById(productId);
        const user = await User.findById(req.userId);

        await user.subtractFromCart(product);
        const updatedUser = await User.findById(req.userId).populate('cart.items.productId');
        res.status(200).json({ cart: updatedUser.cart.items });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.postSetCartItem = async (req, res, next) => {
    const { productId, quantity } = req.body;

    try {
        const product = await Product.findById(productId);
        const user = await User.findById(req.userId);

        await user.setCartItem(product, quantity);
        const updatedUser = await User.findById(req.userId).populate('cart.items.productId');
        res.status(200).json({ cart: updatedUser.cart.items });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.postDeleteCartItem = async (req, res, next) => {
    const productId = req.body.productId;

    try {
        const user = await User.findById(req.userId);

        await user.removeFromCart(productId);
        const updatedUser = await User.findById(req.userId).populate('cart.items.productId');
        res.status(200).json({ cart: updatedUser.cart.items });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.postClearCart = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);

        await user.clearCart();
        res.status(201).json({ cart: user.cart.items });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.getMyCommunity = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        const products = await Product.find({ userId: req.userId }, null, { sort: { createdAt: -1 } });
        const users = await User.find(null, null, { sort: { createdAt: -1 } });
        const followers = users.filter(u => u.communities.includes(req.userId));
        const following = users.filter(u => user.communities.includes(u._id));

        res.status(200).json({
            community: {
                products, followers, following, ...user.community, owner: {
                    name: user.name,
                    email: user.email,
                    photo: user.photo,
                    _id: user._id
                }
            }
        });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.getMyCommunities = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).populate('roleId');
        const users = await User.find();
        const communities = [];

        if (['Commerçant', 'Administrateur'].includes(user.roleId.name)) {
            const products = await Product.find({ userId: req.userId }, null, { sort: { createdAt: -1 } });
            const followers = users.filter(u => u.communities.includes(req.userId));
            const following = users.filter(u => user.communities.includes(u._id));
            const messages = await Message.find({ communityId: req.userId }).populate('userId');

            communities.push({
                products,
                followers,
                following,
                owner: {
                    name: user.name,
                    email: user.email,
                    photo: user.photo,
                    _id: user._id
                },
                ...user.community,
                messages
            });
        }

        await Promise.all(user.communities.map(async userId => {
            // const communityOwner = await User.findById(userId);
            const communityOwner = users.find(u => u._id.toString() === userId.toString());
            const products = await Product.find({ userId }, null, { sort: { createdAt: -1 } });
            const followers = users.filter(u => u.communities.includes(userId));
            const following = users.filter(u => communityOwner.communities.includes(u._id));
            const messages = await Message.find({ communityId: userId }).populate('userId');
            console.log(communityOwner);

            communities.push({
                products,
                followers,
                following,
                owner: {
                    _id: communityOwner._id,
                    name: communityOwner.name,
                    email: communityOwner.email,
                    photo: communityOwner.photo,
                },
                ...communityOwner.community,
                messages
            });
        }));
        communities.sort((a, b) => {
            const aLastMessage = a.messages[a.messages.length - 1];
            const bLastMessage = b.messages[b.messages.length - 1];

            return new Date(bLastMessage.createdAt).getTime() - new Date(aLastMessage.createdAt).getTime();
        });

        res.status(200).json({ communities });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.postMyCommunity = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const user = await User.findById(req.userId);
        user.community.name = name;
        user.community.description = description;
        if (req.file) user.community.imageUrl = req.file.path;

        await user.save();

        const products = await Product.find({ userId: req.userId }, null, { sort: { createdAt: -1 } });
        const users = await User.find(null, null, { sort: { createdAt: -1 } });
        const followers = users.filter(u => u.communities.includes(req.userId));
        const following = users.filter(u => user.communities.includes(u._id));

        res.status(200).json({
            community: {
                products, followers, following, ...user.community, owner: {
                    name: user.name,
                    email: user.email,
                    photo: user.photo,
                    _id: user._id
                }
            }
        });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
}

exports.getCommunity = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        const products = await Product.find({ userId }, null, { sort: { createdAt: -1 } });
        const users = await User.find(null, null, { sort: { createdAt: -1 } });
        const followers = users.filter(u => u.communities.includes(userId));
        const following = users.filter(u => user.communities.includes(u._id));

        res.status(200).json({
            community: {
                products, followers, following, ...user.community, owner: {
                    name: user.name,
                    email: user.email,
                    photo: user.photo,
                    _id: user._id
                }
            }
        });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.getCommunities = async (req, res, next) => {
    try {
        const users = await User.find();
        const communities = users.map(async user => {
            const products = await Product.find({ userId: user._id }, null, { sort: { createdAt: -1 } });
            const followers = users.filter(u => u.communities.includes(userId));
            const following = users.filter(u => user.communities.includes(u._id));

            communities.push({
                products,
                followers,
                following,
                ...user.community,
                owner: {
                    name: user.name,
                    email: user.email,
                    photo: user.photo,
                    _id: user._id
                }
            });
        });

        res.status(200).json({ communities });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.getCheckout = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).populate('cart.items.productId');

        const products = user.cart.items;
        let total = 0;
        products.forEach(p => {
            total += p.quantity * p.productId.price;
        });
        res.status(200).json({
            products, total
        });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.postOrder = async (req, res, next) => {
    let totalSum = 0;

    try {
        const user = await User.findById(req.userId).populate('cart.items.productId');

        user.cart.items.forEach(p => {
            totalSum += p.quantity * p.productId.price;
        });
        const products = user.cart.items.map(item => ({
            quantity: item.quantity,
            product: { ...item.productId._doc }
        }));
        const order = new Order({
            user: { email: user.email, userId: user },
            products
        });
        await order.save();
        await user.clearCart();
        res.status(200).json(true);
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.getOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ 'user.userId': req.userId }, null, { sort: { createdAt: -1 } });
        res.status(200).json({ orders });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.getInvoice = async (req, res, next) => {
    const orderId = req.params.orderId;

    try {
        const order = await Order.findById(orderId);
        if (!order) return next(new Error('Aucune commande trouvée.'));
        if (order.user.userId.toString() !== req.userId.toString()) return next(new Error('Accès interdit.'));
        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName);

        const pdfDoc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);

        pdfDoc.fontSize(26).text('Facture', {
            underline: true
        });
        pdfDoc.text('-----------------------').fontSize(14);
        let totalPrice = 0;
        for (product of order.products) {
            totalPrice += product.quantity * product.product.price;
            pdfDoc.text(product.product.title + ' - ' + product.quantity + ' x ' + product.product.price + ' FCFA');
        }
        pdfDoc.fontSize(26).text('-----------------------');
        pdfDoc.fontSize(20).text('Prix total : ' + totalPrice + ' FCFA');

        pdfDoc.end();
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};