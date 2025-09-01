const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  surname: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  services: [{
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    imageUrl: { type: String, default: '' }
  }],
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  availability: [{
    dayOfWeek: String,
    from: String,
    to: String
  }],

  bookings: [{
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],

  image: String,
  experience: Number,
  bio: String
});

module.exports = mongoose.model('Worker', workerSchema); 