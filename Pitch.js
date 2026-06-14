const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  time:   { type: String, required: true }, // مثلاً "۱۸:۰۰–۱۹:۰۰"
  taken:  { type: Boolean, default: false },
  takenBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { _id: false });

const pitchSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  type:    { type: String, enum: ['futsal', 'grass'], required: true },
  size:    { type: Number, enum: [5, 7, 11], required: true },
  price:   { type: Number, required: true }, // تومان
  address: { type: String, required: true },
  desc:    { type: String },
  tags:    [String],
  color1:  { type: String, default: '#0d3320' },
  color2:  { type: String, default: '#051a0e' },
  isActive:{ type: Boolean, default: true },

  // سانس‌های روزانه (ریست میشن)
  slots: {
    type: [slotSchema],
    default: () => [
      { time: '۰۸:۰۰–۰۹:۰۰', taken: false },
      { time: '۰۹:۰۰–۱۰:۰۰', taken: false },
      { time: '۱۰:۰۰–۱۱:۰۰', taken: false },
      { time: '۱۱:۰۰–۱۲:۰۰', taken: false },
      { time: '۱۴:۰۰–۱۵:۰۰', taken: false },
      { time: '۱۵:۰۰–۱۶:۰۰', taken: false },
      { time: '۱۶:۰۰–۱۷:۰۰', taken: false },
      { time: '۱۷:۰۰–۱۸:۰۰', taken: false },
      { time: '۱۸:۰۰–۱۹:۰۰', taken: false },
      { time: '۱۹:۰۰–۲۰:۰۰', taken: false },
      { time: '۲۰:۰۰–۲۱:۰۰', taken: false },
      { time: '۲۱:۰۰–۲۲:۰۰', taken: false },
    ]
  },

  createdAt: { type: Date, default: Date.now },
});

// تعداد سانس‌های خالی (virtual)
pitchSchema.virtual('availCount').get(function() {
  return this.slots.filter(s => !s.taken).length;
});

pitchSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Pitch', pitchSchema);
