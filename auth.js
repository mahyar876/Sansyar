const express   = require('express');
const router    = express.Router();
const User      = require('./User');
const { protect, signToken } = require('./authController');

// ── پاسخ با توکن ──
function sendToken(res, user, statusCode = 200) {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id:    user._id,
      name:  user.name,
      phone: user.phone,
      email: user.email,
      role:  user.role,
    }
  });
}

// ─────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────
router.post('/register', async (req, res) => {
  console.log('📥 REGISTER STARTED');
  console.log('Request body:', req.body);
  
  try {
    const { name, phone, email, password } = req.body;
    console.log('Destructured:', { name, phone, email, password: password ? 'has password' : 'no password' });

    const exists = await User.findOne({ phone });
    console.log('User exists check:', exists);

    if (exists) {
      return res.status(400).json({ success: false, message: 'این شماره قبلاً ثبت شده' });
    }

    const emailValue = email && email.trim() !== '' ? email : null;
    console.log('Email value:', emailValue);

    console.log('Creating user...');
    const user = await User.create({
      name,
      phone,
      email: emailValue,
      password
    });
    console.log('User created:', user._id);

    console.log('Sending token...');
    sendToken(res, user, 201);

  } catch (err) {
    console.error('❌ REGISTER ERROR:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────
// POST /api/auth/login  (ایمیل + رمز)
// ─────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'ایمیل و رمز عبور الزامی است' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'اطلاعات اشتباه است' });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'اطلاعات اشتباه است' });
    }

    sendToken(res, user);

  } catch (err) {
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ─────────────────────────────────────
// POST /api/auth/login-otp  (موبایل — mock)
// در پروداکشن باید SMS واقعی بفرستی
// ─────────────────────────────────────
const otpStore = new Map(); // { phone: { otp, expiry } }

router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!/^09[0-9]{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'شماره معتبر نیست' });
    }

    // تولید OTP 4 رقمی
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore.set(phone, { otp, expiry: Date.now() + 2 * 60 * 1000 }); // 2 دقیقه

    // TODO: ارسال SMS واقعی (ملی‌پیام، کاوه‌نگار، ...)
    console.log(`📱 OTP برای ${phone}: ${otp}`); // فقط در dev

    res.json({ success: true, message: 'رمز ارسال شد', dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined });

  } catch (err) {
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const record = otpStore.get(phone);

    if (!record) {
      return res.status(400).json({ success: false, message: 'ابتدا رمز درخواست کن' });
    }
    if (Date.now() > record.expiry) {
      otpStore.delete(phone);
      return res.status(400).json({ success: false, message: 'رمز منقضی شده' });
    }
    if (record.otp !== otp) {
      return res.status(400).json({ success: false, message: 'رمز اشتباه است' });
    }

    otpStore.delete(phone);

    // اگه کاربر وجود نداشت، ثبت‌نام خودکار
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ name: 'کاربر جدید', phone });
    }

    sendToken(res, user);

  } catch (err) {
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ─────────────────────────────────────
// GET /api/auth/me  (اطلاعات خودم)
// ─────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.json({
    success: true,
    user: {
      id:    req.user._id,
      name:  req.user.name,
      phone: req.user.phone,
      email: req.user.email,
      role:  req.user.role,
    }
  });
});

// ─────────────────────────────────────
// PATCH /api/auth/me  (ویرایش پروفایل)
// ─────────────────────────────────────
router.patch('/me', protect, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
