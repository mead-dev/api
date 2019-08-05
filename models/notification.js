const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    type: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    data: {
        type: Object,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);