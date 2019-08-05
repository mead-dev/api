const Order = require('../../models/order');

exports.index = async (req, res, next) => {
    try {
        const orders = await Order.find(null, null, { sort: { createdAt: -1 } }).populate('user.userId');

        res.status(200).json({ orders });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }

};

exports.destroy = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const order = Order.findById(orderId);

        await order.remove();

        const orders = await Order.find(null, null, { sort: { createdAt: -1 } });

        res.status(201).json({ orders });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};