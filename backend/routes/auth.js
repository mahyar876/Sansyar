const express    = require('express');
const router     = express.Router();
const nodemailer = require('nodemailer');
const User       = require('../models/User');
const { protect, signToken } = require('../middleware/authController');

// ── تنظیم Gmail ──
const transporter = nodemailer.createTransport({
  service: 'gmail',  // ✅ درست
  auth: {
    user: process.env.NOTIFY_EMAIL,
    pass: process.env.GMAIL_PASS,
  }
});

// ── ارسال OTP به ایمیل ──
async function sendOtpEmail(phone, otp) {
  try {
    await transporter.sendMail({
      from:    `"سانس‌یار" <${process.env.NOTIFY_EMAIL}>`,
      to:      process.env.NOTIFY_EMAIL,
      subject: `کد OTP جدید — ${phone}`,
      text:    `شماره موبایل: ${phone}\nکد OTP: ${otp}\nمدت اعتبار: ۲ دقیقه`,
      html: `
        <div dir="rtl" style="font-family:Tahoma,sans-serif;background:#07100d;color:#f0faf4;padding:32px;border-radius:12px;max-width:400px;margin:auto">
          <h2 style="color:#22c55e;margin-bottom:8px">سانس‌یار 🔑</h2>
          <p style="color:#7fa98c;margin-bottom:24px">درخواست کد ورود جدید</p>
          <div style="background:#0d1f17;border:1px solid rgba(34,197,94,0.25);border-radius:10px;padding:20px;text-align:center;margin-bottom:20px">
            <div style="font-size:12px;color:#3d6650;margin-bottom:8px">شماره موبایل</div>
            <div style="font-size:16px;font-weight:bold;direction:ltr">${phone}</div>
          </div>
          <div style="background:#0d1f17;border:2px solid #22c55e;border-radius:10px;padding:24px;text-align:center;margin-bottom:20px">
            <div style="font-size:12px;color:#3d6650;margin-bottom:10px">کد OTP</div>
            <div style="font-size:36px;font-weight:900;color:#22c55e;letter-spacing:10px">${otp}</div>
          </div>
          <p style="font-size:12px;color:#3d6650;text-align:center">این کد تا ۲ دقیقه معتبر است</p>
        </div>
      `
    });
    console.log(`📧 OTP ایمیل شد — شماره: ${phone} | کد: ${otp}`);
  } catch (err) {
    console.error('❌ ارسال ایمیل OTP ناموفق:', err.message);
  }
}

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
// POST /api/auth/send-otp
// ─────────────────────────────────────
const otpStore = new Map();

router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!/^09[0-9]{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'شماره معتبر نیست' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore.set(phone, { otp, expiry: Date.now() + 2 * 60 * 1000 });

    console.log(`📱 OTP برای ${phone}: ${otp}`);

    // ارسال به ایمیل (بدون await تا response سریع باشه)
    console.log('📧 ایمیل:', process.env.NOTIFY_EMAIL);
console.log('🔑 پسورد موجوده:', !!process.env.GMAIL_PASS);
/*await*/ sendOtpEmail(phone, otp);

    res.json({
      success: true,
      message: 'رمز ارسال شد',
      dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ─────────────────────────────────────
// POST /api/auth/verify-otp
// ─────────────────────────────────────
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
// GET /api/auth/me
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
// PATCH /api/auth/me
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