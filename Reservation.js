const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pitch:     { type: mongoose.Schema.Types.ObjectId, ref: 'Pitch', required: true },
  slotIndex: { type: Number, required: true },
  slotTime:  { type: String, required: true },   // "۱۸:۰۰–۱۹:۰۰"
  date:      { type: String, required: true },   // "1403/03/24"
  playerCount:{ type: Number, default: 5 },
  note:      { type: String, default: '' },
  amount:    { type: Number, required: true },   // تومان

  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending',
  },

  // کد رزرو یکتا
  code: {
    type: String,
    unique: true,
    default: () => 'SNS-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
  },

  // اطلاعات پرداخت (mock)
  payment: {
    transactionId: String,
    paidAt:        Date,
    method:        { type: String, default: 'card' },
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Reservation', reservationSchema);
