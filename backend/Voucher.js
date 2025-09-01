const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    amount: {
        type: Number,
        required: true,
        enum: [100, 200, 500] // Only allow these amounts
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    used: {
        type: Boolean,
        default: false
    },
    usedAt: {
        type: Date
    },
    usedForBooking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    paymentIntentId: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        default: function () {
            // Vouchers expire 1 year from creation
            return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        }
    }
}, {
    timestamps: true
});


voucherSchema.index({ userId: 1, used: 1 });
voucherSchema.index({ code: 1 });
voucherSchema.index({ expiresAt: 1 });

// Generate unique voucher code
voucherSchema.statics.generateVoucherCode = function () {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

module.exports = mongoose.model('Voucher', voucherSchema);