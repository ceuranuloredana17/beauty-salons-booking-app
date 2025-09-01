const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  service: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,  
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'confirmed'
  },
  clientName: {
    type: String,
    required: true
  },
  clientEmail: {
    type: String,
    required: true
  },
  clientPhone: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['location', 'voucher'],
    default: 'location'
  },
  voucherUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher'
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  }
});


bookingSchema.index({ workerId: 1, date: 1 });

module.exports = mongoose.model('Booking', bookingSchema); 