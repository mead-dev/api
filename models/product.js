const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    size: String,
    color: String,
    brand: String,
    delivery: Number,
    quantity: {
        type: Number,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);