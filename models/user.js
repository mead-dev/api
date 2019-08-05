const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phone: String,
    resetToken: String,
    resetTokenExpiration: Date,
    roleId: {
        type: Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    },
    cart: {
        items: [{
            productId: {
                type: Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }]
    },
    notifications: [{
        notification: {
            type: Schema.Types.ObjectId,
            ref: 'Notification',
            required: true
        },
        readAt: Date
    }],
    communities: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    community: {
        name: {
            type: String,
            required: true,
            default: "Ma communauté"
        },
        imageUrl: {
            type: String,
            required: true,
            default: "/"
        },
        description: String
    },
    photo: String
}, { timestamps: true });

userSchema.methods.addToCart = function (product) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
    });
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];
    if (cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
        updatedCartItems.push({ productId: product._id, quantity: newQuantity });
    }
    const updatedCart = { items: updatedCartItems };
    this.cart = updatedCart;
    return this.save();
};

userSchema.methods.subtractFromCart = function (product) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
    });
    if (cartProductIndex >= 0) {
        const updatedCartItems = [...this.cart.items];
        const newQuantity = this.cart.items[cartProductIndex].quantity - 1;
        if (newQuantity > 0) updatedCartItems[cartProductIndex].quantity = newQuantity;
        else return this.removeFromCart(this.cart.items[cartProductIndex].productId);

        const updatedCart = { items: updatedCartItems };
        this.cart = updatedCart;
        return this.save();
    }
};

userSchema.methods.setCartItem = function (product, quantity) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
    });
    if (cartProductIndex >= 0) {
        const updatedCartItems = [...this.cart.items];
        if (quantity > 0) updatedCartItems[cartProductIndex].quantity = quantity;
        else return this.removeFromCart(this.cart.items[cartProductIndex].productId);

        const updatedCart = { items: updatedCartItems };
        this.cart = updatedCart;
        return this.save();
    }
};

userSchema.methods.removeFromCart = function (productId) {
    const updatedCartItems = this.cart.items.filter(item => {
        return item.productId.toString() !== productId.toString();
    });
    this.cart.items = updatedCartItems;
    return this.save();
};

userSchema.methods.clearCart = function () {
    this.cart.items = [];
    return this.save();
};

module.exports = mongoose.model('User', userSchema);