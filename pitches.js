const express = require('express');
const router  = express.Router();
const Pitch   = require('./Pitch');
const { protect, adminOnly } = require('./authController');

// ─────────────────────────────────────
// GET /api/pitches  (لیست همه زمین‌ها)
// ─────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { type, size, sort } = req.query;
    const filter = { isActive: true };

    if (type) filter.type = type;
    if (size) filter.size = parseInt(size);

    let query = Pitch.find(filter);

    if (sort === 'price')      query = query.sort({ price: 1 });
    else if (sort === 'price-desc') query = query.sort({ price: -1 });
    else                       query = query.sort({ createdAt: 1 });

    const pitches = await query;

    // اضافه کردن availCount به هر زمین
    const data = pitches.map(p => ({
      ...p.toJSON(),
      avail: p.slots.filter(s => !s.taken).length,
    }));

    // مرتب‌سازی بر اساس avail اگه لازم بود
    if (sort === 'avail') data.sort((a, b) => b.avail - a.avail);

    res.json({ success: true, count: data.length, pitches: data });

  } catch (err) {
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ─────────────────────────────────────
// GET /api/pitches/:id  (جزئیات یه زمین)
// ─────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const pitch = await Pitch.findById(req.params.id);
    if (!pitch || !pitch.isActive) {
      return res.status(404).json({ success: false, message: 'زمین پیدا نشد' });
    }
    res.json({
      success: true,
      pitch: {
        ...pitch.toJSON(),
        avail: pitch.slots.filter(s => !s.taken).length,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ─────────────────────────────────────
// GET /api/pitches/:id/slots  (سانس‌های یه زمین)
// ─────────────────────────────────────
router.get('/:id/slots', async (req, res) => {
  try {
    const pitch = await Pitch.findById(req.params.id).select('slots name');
    if (!pitch) return res.status(404).json({ success: false, message: 'زمین پیدا نشد' });

    res.json({ success: true, slots: pitch.slots });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ─────────────────────────────────────
// POST /api/pitches  (ادمین — اضافه کردن زمین)
// ─────────────────────────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const pitch = await Pitch.create(req.body);
    res.status(201).json({ success: true, pitch });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map(e => e.message).join(' | ');
      return res.status(400).json({ success: false, message: msg });
    }
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ─────────────────────────────────────
// PATCH /api/pitches/:id  (ادمین — ویرایش)
// ─────────────────────────────────────
router.patch('/:id', protect, adminOnly, async (req, res) => {
  try {
    const pitch = await Pitch.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!pitch) return res.status(404).json({ success: false, message: 'زمین پیدا نشد' });
    res.json({ success: true, pitch });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────
// DELETE /api/pitches/:id  (ادمین — غیرفعال کردن)
// ─────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Pitch.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'زمین غیرفعال شد' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

module.exports = router;
