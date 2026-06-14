const express     = require('express');
const router      = express.Router();
const Reservation = require('./Reservation');
const Pitch       = require('./Pitch');
const { protect, adminOnly } = require('./authController');

// ─────────────────────────────────────
// POST /api/reservations  (ثبت رزرو)
// ─────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { pitchId, slotIndex, date, playerCount, note } = req.body;

    // پیدا کردن زمین
    const pitch = await Pitch.findById(pitchId);
    if (!pitch || !pitch.isActive) {
      return res.status(404).json({ success: false, message: 'زمین پیدا نشد' });
    }

    // چک سانس
    const slot = pitch.slots[slotIndex];
    if (!slot) {
      return res.status(400).json({ success: false, message: 'سانس نامعتبر است' });
    }
    if (slot.taken) {
      return res.status(400).json({ success: false, message: 'این سانس قبلاً رزرو شده' });
    }

    // ثبت رزرو
    const reservation = await Reservation.create({
      user:        req.user._id,
      pitch:       pitchId,
      slotIndex,
      slotTime:    slot.time,
      date,
      playerCount: playerCount || pitch.size,
      note:        note || '',
      amount:      pitch.price,
      status:      'pending',
    });

    // علامت‌گذاری سانس به عنوان رزرو شده
    pitch.slots[slotIndex].taken   = true;
    pitch.slots[slotIndex].takenBy = req.user._id;
    await pitch.save();

    res.status(201).json({
      success: true,
      message: 'رزرو ثبت شد. منتظر تأیید پرداخت...',
      reservation: {
        id:       reservation._id,
        code:     reservation.code,
        pitch:    pitch.name,
        slotTime: slot.time,
        date,
        amount:   pitch.price,
        status:   reservation.status,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ─────────────────────────────────────
// POST /api/reservations/:id/pay  (تأیید پرداخت — mock)
// ─────────────────────────────────────
router.post('/:id/pay', protect, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'رزرو پیدا نشد' });
    }
    if (reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'دسترسی ندارید' });
    }
    if (reservation.status === 'paid') {
      return res.status(400).json({ success: false, message: 'این رزرو قبلاً پرداخت شده' });
    }

    // شبیه‌سازی تأیید پرداخت
    reservation.status            = 'paid';
    reservation.payment.transactionId = 'TXN-' + Date.now();
    reservation.payment.paidAt       = new Date();
    await reservation.save();

    res.json({
      success: true,
      message: 'پرداخت تأیید شد 🎉',
      code:    reservation.code,
      transactionId: reservation.payment.transactionId,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ─────────────────────────────────────
// GET /api/reservations/my  (رزروهای خودم)
// ─────────────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id })
      .populate('pitch', 'name type size address')
      .sort({ createdAt: -1 });

    res.json({ success: true, reservations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ─────────────────────────────────────
// DELETE /api/reservations/:id  (لغو رزرو)
// ─────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'رزرو پیدا نشد' });
    }
    if (reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'دسترسی ندارید' });
    }
    if (reservation.status === 'paid') {
      return res.status(400).json({ success: false, message: 'رزرو پرداخت‌شده را نمیتوان لغو کرد' });
    }

    // آزاد کردن سانس
    const pitch = await Pitch.findById(reservation.pitch);
    if (pitch) {
      pitch.slots[reservation.slotIndex].taken   = false;
      pitch.slots[reservation.slotIndex].takenBy = null;
      await pitch.save();
    }

    reservation.status = 'cancelled';
    await reservation.save();

    res.json({ success: true, message: 'رزرو لغو شد' });

  } catch (err) {
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ─────────────────────────────────────
// GET /api/reservations  (ادمین — همه رزروها)
// ─────────────────────────────────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('user', 'name phone')
      .populate('pitch', 'name type')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reservations.length, reservations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

module.exports = router;
