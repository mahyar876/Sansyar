// =========================
// SHARED UTILITIES
// =========================
function numFa(n) {
  return n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
}
function priceFa(n) {
  return numFa(n.toLocaleString('en'));
}
// قیمت به فرمت «۱۸۰ هزار تومان»
function priceFaWords(n) {
  n = parseInt(n) || 0;
  if (n % 1000 === 0) {
    return numFa((n / 1000).toLocaleString('en')) + ' هزار تومان';
  }
  return priceFa(n) + ' تومان';
}

// =========================
// شمسی (Jalali) — تبدیل میلادی به شمسی، بدون کتابخانه خارجی
// =========================
function gregorianToJalali(gy, gm, gd) {
  var g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  var jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  var gy2 = (gm > 2) ? (gy + 1) : gy;
  var days = (365 * gy) + (Math.floor((gy2 + 3) / 4)) - (Math.floor((gy2 + 99) / 100))
    + (Math.floor((gy2 + 399) / 400)) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * (Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * (Math.floor(days / 1461));
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  var jm, jd;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

var JALALI_MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
var JALALI_WEEKDAYS = ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'];

// تاریخ میلادی (Date object یا yyyy-mm-dd) -> رشته شمسی خوانا
function toJalaliString(input) {
  var d = (input instanceof Date) ? input : new Date(input);
  if (isNaN(d.getTime())) return String(input);
  var j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  var weekday = JALALI_WEEKDAYS[d.getDay()];
  return weekday + ' ' + numFa(j[2]) + ' ' + JALALI_MONTHS[j[1] - 1] + ' ' + numFa(j[0]);
}

// تاریخ میلادی -> شمسی خام {y,m,d}
function toJalaliParts(input) {
  var d = (input instanceof Date) ? input : new Date(input);
  var j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return { y: j[0], m: j[1], d: j[2] };
}

function jalaliToGregorian(jy, jm, jd) {
  var gy = (jy <= 979) ? 621 : 1600;
  jy -= (jy <= 979) ? 0 : 979;
  var days = (365 * jy) + ((Math.floor(jy / 33)) * 8) + (Math.floor(((jy % 33) + 3) / 4)) + 78 + jd
    + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  gy += 400 * (Math.floor(days / 146097));
  days %= 146097;
  if (days > 36524) {
    gy += 100 * (Math.floor(--days / 36524));
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * (Math.floor(days / 1461));
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  var gd = days + 1;
  var sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var gm;
  for (gm = 0; gm < 13; gm++) {
    var v = sal_a[gm];
    if (gd <= v) break;
    gd -= v;
  }
  return [gy, gm, gd];
}

function daysInJalaliMonth(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  // اسفند: کبیسه یا نه — با محاسبه دقیق فاصله تا اول فروردین سال بعد
  var g1 = jalaliToGregorian(jy, 12, 29);
  var g2 = jalaliToGregorian(jy + 1, 1, 1);
  var d1 = new Date(g1[0], g1[1] - 1, g1[2]);
  var d2 = new Date(g2[0], g2[1] - 1, g2[2]);
  return (d2 - d1 === 86400000) ? 29 : 30;
}

// =========================
// INDEX PAGE ONLY
// =========================
if (document.getElementById('topBtn')) {

  const observer = new IntersectionObserver(
    (entries) => { entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("show"); }); },
    { threshold: 0.2 }
  );
  document.querySelectorAll(".card, .how-step, .stat").forEach((el) => observer.observe(el));

  document.querySelectorAll("[data-target]").forEach((counter) => {
    const updateCounter = () => {
      const target = +counter.dataset.target;
      const current = +counter.innerText;
      const increment = target / 100;
      if (current < target) {
        counter.innerText = Math.ceil(current + increment);
        requestAnimationFrame(updateCounter);
      } else {
        counter.innerText = target.toLocaleString("fa-IR");
      }
    };
    updateCounter();
  });

  const topBtn = document.getElementById("topBtn");
  window.addEventListener("scroll", () => { topBtn.classList.toggle("active", window.scrollY > 500); });
  topBtn.addEventListener("click", () => { window.scrollTo({ top: 0, behavior: "smooth" }); });

  // ── Show "حساب من" if logged in ──
  (function() {
    const user = sessionStorage.getItem('sns_user');
    const loginBtn = document.querySelector('.header .btn');
    if (user && loginBtn) {
      loginBtn.textContent = 'حساب من';
      loginBtn.href = './profile.html';
      loginBtn.classList.remove('btn-ghost');
      loginBtn.style.background = 'transparent';
      loginBtn.style.color = 'var(--green)';
      loginBtn.style.border = '1.5px solid var(--green)';
      loginBtn.style.boxShadow = 'none';
    }
  })();

  // ── LIVE COUNTER ──
  (function() {
    const countEl = document.getElementById('liveCount');
    if (!countEl) return;
    let current = Math.floor(Math.random() * 5) + 2;
    function updateCount() {
      countEl.textContent = numFa(current);
      const delta = Math.random() < 0.5 ? 1 : -1;
      current = Math.max(1, Math.min(9, current + delta));
    }
    updateCount();
    setInterval(updateCount, Math.floor(Math.random() * 4000) + 4000);
  })();

  // ── TIMER PILL ──
  (function() {
    const secEl = document.getElementById('timerSec');
    if (!secEl) return;
    function randomTime() { return Math.floor(Math.random() * 31) + 45; }
    let target = randomTime();
    let current = 60;
    secEl.textContent = numFa(current);
    setInterval(function() {
      if (current === target) {
        setTimeout(function() { target = randomTime(); }, 2000);
        return;
      }
      current += current < target ? 1 : -1;
      secEl.textContent = numFa(current);
    }, 800);
  })();

  // ── SET HERO DATE ──
  (function() {
    const dateEl = document.getElementById('heroDate');
    if (!dateEl) return;
    try {
      dateEl.textContent = toJalaliString(new Date());
    } catch(e) {}
  })();
}

// =========================
// RESERVE PAGE ONLY
// =========================
if (document.getElementById('pitchesGrid')) {

  // ── GLOBAL STATE (قابل دسترس از همه جا) ──
  window.SNS = {
    API:        'https://sansyar-1.onrender.com/api',
    typeLabel:     { futsal: 'فوتسال', grass: 'چمن' },
    pitches:       [],
    filteredList:  [],
    selectedPitch: null,
    selectedSlot:  null,
    selectedDate:  null, // Date شیء میلادی معادل تاریخ شمسی انتخاب‌شده
  };

  // ══════════════════════════════════════════════════════
  // سانس‌های پیش‌فرض — از localStorage ادمین خوانده می‌شه
  // ══════════════════════════════════════════════════════
  const DEFAULT_SLOT_DEFS = [
    {time:'۰۶:۰۰–۰۷:۳۰', price:550000},
    {time:'۰۷:۳۰–۰۹:۰۰', price:550000},
    {time:'۰۹:۰۰–۱۰:۳۰', price:550000},
    {time:'۱۰:۳۰–۱۲:۰۰', price:550000},
    {time:'۱۲:۰۰–۱۳:۳۰', price:550000},
    {time:'۱۳:۳۰–۱۵:۰۰', price:550000},
    {time:'۱۵:۰۰–۱۶:۳۰', price:550000},
    {time:'۱۶:۳۰–۱۸:۰۰', price:700000},
    {time:'۱۸:۰۰–۱۹:۳۰', price:700000},
    {time:'۱۹:۳۰–۲۱:۰۰', price:700000},
    {time:'۲۱:۰۰–۲۲:۳۰', price:700000},
  ];

  // خوندن state ادمین از localStorage
  function getAdminState() {
    try {
      const saved = localStorage.getItem('sansyar_admin_state');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return null;
  }

  // سانسu200cهای جهانی u2014 هر بار تازه از localStorage میخونه
  function getSlotDefs() {
    const st = getAdminState();
    return (st && st.slots && st.slots.length) ? st.slots : DEFAULT_SLOT_DEFS;
  }

  // سانس از slotDefs جهانی u2014 takenArr مشخص میu200cکنه کدوم رزروه
  function makeSlots(takenArr) {
    const defs = getSlotDefs();
    return defs.map(function(s, i) {
      return { time: s.time, price: s.price, taken: takenArr[i] || false };
    });
  }

  // سانس اختصاصی برای یک زمین خاص (از پنل ادمین)
  function makePitchSlots(defs, takenArr) {
    return defs.map(function(s, i) {
      return { time: s.time, price: s.price, taken: takenArr[i] || false };
    });
  }

  // داده‌های پیش‌فرض زمین‌ها (قیمت‌های اصلی از seed.js)
  const DEFAULT_STATIC_PITCHES_RAW = [
    {
      id: '1', name: 'سالن فوتسال آریا', type: 'futsal', size: 5,
      price: 180000, color1: '#0d3320', color2: '#051a0e',
      tags: ['سرپوشیده', 'رختکن', 'کفپوش PVC', 'نور مصنوعی'],
      address: 'خیابان ولیعصر، نرسیده به میدان ونک',
      takenArr: [false,false,false,false,false,false,false,false,true,false,true]
    },
    {
      id: '2', name: 'چمن فوتبال پارک ملت', type: 'grass', size: 11,
      price: 320000, color1: '#0a2e10', color2: '#040f06',
      tags: ['چمن مصنوعی', 'روشنایی شبانه', 'پارکینگ', 'تریبون'],
      address: 'پارک ملت، بلوار کشاورز',
      takenArr: [true,true,false,false,false,false,false,true,false,false,true]
    },
    {
      id: '3', name: 'فوتسال ستاره شرق', type: 'futsal', size: 7,
      price: 210000, color1: '#0d2e1a', color2: '#060f08',
      tags: ['سرپوشیده', 'دوش', 'نوشیدنی', 'وای‌فای'],
      address: 'نارمک، خیابان دماوند',
      takenArr: [false,false,false,false,false,false,false,false,false,false,false]
    },
    {
      id: '4', name: 'زمین چمن رضایی', type: 'grass', size: 7,
      price: 250000, color1: '#082510', color2: '#030c05',
      tags: ['چمن طبیعی', 'تریبون', 'بوفه', 'رختکن'],
      address: 'تهران پارس، خیابان شکوفه',
      takenArr: [true,false,false,true,false,false,false,true,false,false,false]
    },
    {
      id: '5', name: 'سالن ورزشی امید', type: 'futsal', size: 5,
      price: 160000, color1: '#0d3320', color2: '#051a0e',
      tags: ['سرپوشیده', 'رختکن', 'مربی آزاد'],
      address: 'صادقیه، خیابان آیت‌الله کاشانی',
      takenArr: [false,false,true,false,false,false,false,true,false,false,false]
    },
    {
      id: '6', name: 'چمن فوتبال دانشگاه', type: 'grass', size: 11,
      price: 280000, color1: '#0a2e10', color2: '#040f06',
      tags: ['چمن مصنوعی', 'روشنایی شبانه', 'دوربین'],
      address: 'انقلاب، محوطه دانشگاه تهران',
      takenArr: [true,true,true,true,false,true,true,true,false,false,false]
    },
  ];

  // ساخت STATIC_PITCHES با ادغام داده‌های ادمین
  function buildStaticPitches() {
    const st = getAdminState();
    const slotDefs = getSlotDefs();
    var lsTaken = {};
    try { lsTaken = JSON.parse(localStorage.getItem('sns_taken_slots') || '{}'); } catch(e) {}
    return DEFAULT_STATIC_PITCHES_RAW.map(function(def, i) {
      var adminP = (st && st.pitches && st.pitches[i]) ? st.pitches[i] : null;
      var takenArr = adminP ? (adminP.takenSlots || def.takenArr) : def.takenArr;
      // اعمال رزروهای mock از localStorage
      var extraTaken = lsTaken[def.id] || [];
      takenArr = takenArr.map(function(t, si) { return t || extraTaken.includes(si); });
      // قیمت‌های اختصاصی هر زمین — از پنل ادمین
      var slotPrices = (adminP && adminP.slotPrices && adminP.slotPrices.length === slotDefs.length)
        ? adminP.slotPrices
        : slotDefs.map(function(s) { return s.price; });
      var slots = slotDefs.map(function(s, si) {
        return { time: s.time, price: slotPrices[si], taken: takenArr[si] || false };
      });
      var avail = slots.filter(function(s) { return !s.taken; }).length;
      // قیمت نمایشی روی کارت: کمترین قیمت سانس‌های این زمین
      var minPrice = slotPrices.reduce(function(min, p) { return p < min ? p : min; }, slotPrices[0]);
      return {
        id: def.id,
        name: adminP ? (adminP.name || def.name) : def.name,
        type: adminP ? (adminP.type || def.type) : def.type,
        size: adminP ? (adminP.size || def.size) : def.size,
        price: minPrice,
        avail: avail,
        color1: def.color1,
        color2: def.color2,
        tags: adminP && adminP.tags && adminP.tags.length ? adminP.tags : def.tags,
        address: adminP ? (adminP.address || def.address) : def.address,
        isActive: adminP ? (adminP.isActive !== false) : true,
        slots: slots,
      };
    }).filter(function(p) { return p.isActive !== false; });
  }

  // STATIC_PITCHES حذف شد 2014 هر بار با buildStaticPitches() تازه ساخته میشه
  // ════════════════════════════════════
  // JALALI DATE PICKER
  // ════════════════════════════════════
  var jpViewYear, jpViewMonth; // ماه/سال شمسی‌ای که الان نمایش داده میشه

  function toggleJalaliPicker() {
    var picker = document.getElementById('jalaliPicker');
    if (picker.classList.contains('open')) {
      picker.classList.remove('open');
      return;
    }
    var base = SNS.selectedDate || new Date();
    var jp = toJalaliParts(base);
    jpViewYear  = jp.y;
    jpViewMonth = jp.m;
    renderJalaliPicker();
    picker.classList.add('open');
  }
  window.toggleJalaliPicker = toggleJalaliPicker;

  function jpChangeMonth(delta) {
    jpViewMonth += delta;
    if (jpViewMonth < 1) { jpViewMonth = 12; jpViewYear--; }
    if (jpViewMonth > 12) { jpViewMonth = 1; jpViewYear++; }
    renderJalaliPicker();
  }
  window.jpChangeMonth = jpChangeMonth;

  function renderJalaliPicker() {
    var picker = document.getElementById('jalaliPicker');
    var todayParts = toJalaliParts(new Date());
    var selectedParts = SNS.selectedDate ? toJalaliParts(SNS.selectedDate) : null;

    // اولین روز ماه به میلادی -> روز هفته (۰=یکشنبه با تنظیم خودمون)
    var firstGregArr = jalaliToGregorian(jpViewYear, jpViewMonth, 1);
    var firstGregDate = new Date(firstGregArr[0], firstGregArr[1] - 1, firstGregArr[2]);
    // getDay(): 0=یکشنبه میلادی... برابر با چیدمان هفته‌ی ما هم هست چون یکشنبه ستون اول
    var startOffset = firstGregDate.getDay();
    var totalDays = daysInJalaliMonth(jpViewYear, jpViewMonth);

    var todayGreg = new Date();
    todayGreg.setHours(0,0,0,0);

    var cellsHtml = '';
    for (var i = 0; i < startOffset; i++) {
      cellsHtml += '<span class="jp-day jp-day-empty"></span>';
    }
    for (var d = 1; d <= totalDays; d++) {
      var gArr = jalaliToGregorian(jpViewYear, jpViewMonth, d);
      var gDate = new Date(gArr[0], gArr[1] - 1, gArr[2]);
      gDate.setHours(0,0,0,0);
      var isPast = gDate < todayGreg;
      var isToday = (todayParts.y === jpViewYear && todayParts.m === jpViewMonth && todayParts.d === d);
      var isSelected = selectedParts && (selectedParts.y === jpViewYear && selectedParts.m === jpViewMonth && selectedParts.d === d);
      var cls = 'jp-day';
      if (isToday) cls += ' jp-today';
      if (isSelected) cls += ' jp-selected';
      if (isPast) cls += ' jp-disabled';
      cellsHtml += '<span class="' + cls + '" ' + (isPast ? '' : 'onclick="jpSelectDay(' + d + ')"') + '>' + numFa(d) + '</span>';
    }

    picker.innerHTML =
      '<div class="jp-head">' +
        '<button type="button" class="jp-nav-btn" onclick="jpChangeMonth(-1)">›</button>' +
        '<span class="jp-title">' + JALALI_MONTHS[jpViewMonth - 1] + ' ' + numFa(jpViewYear) + '</span>' +
        '<button type="button" class="jp-nav-btn" onclick="jpChangeMonth(1)">‹</button>' +
      '</div>' +
      '<div class="jp-weekdays">' +
        ['ی','د','س','چ','پ','ج','ش'].map(function(w){ return '<span>' + w + '</span>'; }).join('') +
      '</div>' +
      '<div class="jp-days">' + cellsHtml + '</div>';
  }

  function jpSelectDay(d) {
    var gArr = jalaliToGregorian(jpViewYear, jpViewMonth, d);
    SNS.selectedDate = new Date(gArr[0], gArr[1] - 1, gArr[2]);
    document.getElementById('dateFilter').value = toJalaliString(SNS.selectedDate);
    document.getElementById('jalaliPicker').classList.remove('open');
    updateSummary();
  }
  window.jpSelectDay = jpSelectDay;

  // بستن picker با کلیک بیرون از آن
  document.addEventListener('click', function(e) {
    var picker = document.getElementById('jalaliPicker');
    var input  = document.getElementById('dateFilter');
    if (!picker) return;
    if (picker.classList.contains('open') && e.target !== input && !picker.contains(e.target)) {
      picker.classList.remove('open');
    }
  });

  // ── فیلتر محلی روی داده‌های static ──
  function applyStaticFilter(pitches) {
    const type = document.getElementById('typeFilter').value;
    const size = parseInt(document.getElementById('sizeFilter').value) || 0;
    const sort = document.getElementById('sortFilter').value;

    let list = pitches.slice();
    if (type) list = list.filter(p => p.type === type);
    if (size && size !== 0) list = list.filter(p => p.size === size);
    if (sort === 'price') list.sort((a, b) => a.price - b.price);
    else if (sort === 'avail') list.sort((a, b) => b.avail - a.avail);
    return list;
  }

  // ── LOAD PITCHES FROM API (با fallback به static) ──
  async function loadPitches() {
    // همیشه تازه از localStorage ادمین میخونه
    const freshPitches = buildStaticPitches();
    SNS._allStatic   = freshPitches;
    SNS.pitches      = freshPitches;
    SNS.filteredList = applyStaticFilter(freshPitches);
    renderPitches();
  }
  window.loadPitches = loadPitches;

  // ── LOAD SLOTS FROM API (با fallback به static) ──
  async function loadSlots(pitchId) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res  = await fetch(SNS.API + '/pitches/' + pitchId + '/slots', { signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.slots;
    } catch (err) {
      // fallback: سانس‌های static رو برگردون
      const staticPitch = buildStaticPitches().find(p => p.id === pitchId || p._id === pitchId);
      return staticPitch ? staticPitch.slots : [];
    }
  }

  // ── RENDER PITCHES ──
  function renderPitches() {
    const grid    = document.getElementById('pitchesGrid');
    const countEl = document.getElementById('pitchCount');
    countEl.textContent = numFa(SNS.filteredList.length) + ' زمین در دسترس';

    if (!SNS.filteredList.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">هیچ زمینی با این فیلتر پیدا نشد</div>';
      return;
    }

    grid.innerHTML = SNS.filteredList.map(function(p) {
      var pid        = p._id || p.id;
      var cover      = p.color1 || '#0d3320';
      var isSelected = SNS.selectedPitch && (SNS.selectedPitch._id || SNS.selectedPitch.id) === pid;
      var tags       = (p.tags || []).slice(0, 3).map(function(t) { return '<span class="pitch-tag">' + t + '</span>'; }).join('');
      return '<div class="pitch-card ' + (isSelected ? 'selected' : '') + '" onclick="selectPitch(\'' + pid + '\')">' +
        '<div class="select-check">✓</div>' +
        '<div class="pitch-thumb" style="background:linear-gradient(140deg,' + cover + ',#060e09)">' +
          '<div class="pitch-thumb-circle"></div>' +
          '<div class="pitch-type-badge">' + SNS.typeLabel[p.type] + '</div>' +
        '</div>' +
        '<div class="pitch-body">' +
          '<div class="pitch-name">' + p.name + '</div>' +
          '<div class="pitch-meta">' + tags + '<span class="pitch-tag">' + numFa(p.size) + ' نفره</span></div>' +
          '<div class="pitch-price-row">' +
            '<div class="pitch-price">از ' + priceFaWords(p.price) + ' <span>/ هر سانس</span></div>' +
            '<div class="pitch-avail"><strong>' + numFa(p.avail || 0) + '</strong> سانس خالی</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  // ── SELECT PITCH ──
  async function selectPitch(id) {
    SNS.selectedPitch = SNS.pitches.find(function(p) { return (p._id === id || p.id === id); });
    SNS.selectedSlot  = null;
    renderPitches();
    updateSummary();
    setStep(2);

    var slots = await loadSlots(SNS.selectedPitch._id || SNS.selectedPitch.id);
    SNS.selectedPitch._slots = slots;
    renderSlots();

    setTimeout(function() {
      document.getElementById('slotsSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  }
  window.selectPitch = selectPitch;

  // ── RENDER SLOTS ──
  function renderSlots() {
    var sec    = document.getElementById('slotsSection');
    var grid   = document.getElementById('slotsGrid');
    var nameEl = document.getElementById('selectedPitchName');

    if (!SNS.selectedPitch) { sec.style.display = 'none'; return; }

    nameEl.textContent = SNS.selectedPitch.name;
    sec.style.display  = 'block';

    var slots  = SNS.selectedPitch._slots || [];

    grid.innerHTML = slots.map(function(slot, i) {
      var isTaken    = slot.taken;
      var isSelected = SNS.selectedSlot === i;
      return '<div class="slot ' + (isTaken ? 'slot-taken' : '') + ' ' + (isSelected ? 'slot-selected' : '') + '" ' +
        (isTaken ? '' : 'onclick="selectSlot(' + i + ')"') + '>' +
        '<span class="slot-time">' + slot.time + '</span>' +
        '<span class="slot-price">' + (isTaken ? 'رزرو شده' : priceFaWords(slot.price || SNS.selectedPitch.price)) + '</span>' +
        '</div>';
    }).join('');
  }

  // ── SELECT SLOT ──
  function selectSlot(i) {
    SNS.selectedSlot = i;
    renderSlots();
    updateSummary();
    setStep(3);
    checkSubmit();
  }
  window.selectSlot = selectSlot;

  // ── GET SLOT TIME ──
  function getSlotTime() {
    if (SNS.selectedSlot === null || !SNS.selectedPitch || !SNS.selectedPitch._slots) return 'انتخاب نشده';
    return (SNS.selectedPitch._slots[SNS.selectedSlot] || {}).time || 'انتخاب نشده';
  }

  function getSlotPrice() {
    if (SNS.selectedSlot === null || !SNS.selectedPitch || !SNS.selectedPitch._slots) return SNS.selectedPitch ? SNS.selectedPitch.price : 0;
    var slot = SNS.selectedPitch._slots[SNS.selectedSlot];
    return (slot && slot.price) ? slot.price : SNS.selectedPitch.price;
  }

  // ── UPDATE SUMMARY ──
  function updateSummary() {
    var el = document.getElementById('summaryContent');
    if (!SNS.selectedPitch) {
      el.innerHTML = '<div class="summary-empty">هنوز زمینی انتخاب نشده</div>';
      return;
    }
    var dateStr = SNS.selectedDate ? toJalaliString(SNS.selectedDate) : 'انتخاب نشده';
    var slotStr = getSlotTime();
    el.innerHTML =
      '<div class="summary-row"><span class="label">زمین</span><span class="value">' + SNS.selectedPitch.name + '</span></div>' +
      '<div class="summary-row"><span class="label">نوع</span><span class="value">' + SNS.typeLabel[SNS.selectedPitch.type] + '</span></div>' +
      '<div class="summary-row"><span class="label">تاریخ</span><span class="value">' + dateStr + '</span></div>' +
      '<div class="summary-row"><span class="label">ساعت</span><span class="value">' + slotStr + '</span></div>' +
      '<div class="summary-row"><span class="label">مبلغ</span><span class="value green">' + priceFaWords(getSlotPrice()) + '</span></div>';
    checkSubmit();
  }

  // ── APPLY FILTER ──
  async function applyFilter() {
    // همیشه تازه از localStorage بخون
    const freshPitches = buildStaticPitches();
    SNS._allStatic   = freshPitches;
    SNS.pitches      = freshPitches;
    SNS.filteredList = applyStaticFilter(freshPitches);
    renderPitches();

    if (SNS.selectedPitch && !SNS.filteredList.find(function(p) {
      return (p._id || p.id) === (SNS.selectedPitch._id || SNS.selectedPitch.id);
    })) {
      SNS.selectedPitch = null;
      SNS.selectedSlot  = null;
      renderSlots();
      updateSummary();
      setStep(1);
    }
  }
  window.applyFilter = applyFilter;

  // ── CHECK SUBMIT ──
  function checkSubmit() {
    var name    = document.getElementById('userName').value.trim();
    var phone   = document.getElementById('userPhone').value.trim();
    var phoneOk = /^09[0-9]{9}$/.test(phone);
    var ok      = SNS.selectedPitch && SNS.selectedSlot !== null && name.length >= 3 && phoneOk;
    document.getElementById('submitBtn').disabled = !ok;
    document.getElementById('userPhone').style.borderColor = (phone && !phoneOk) ? '#ef4444' : '';
    if (ok) setStep(4);
    else if (SNS.selectedPitch && SNS.selectedSlot !== null) setStep(3);
  }

  // ── STEPS BAR ──
  function setStep(n) {
    var labels = ['','۱','۲','۳','۴'];
    for (var i = 1; i <= 4; i++) {
      var item   = document.getElementById('step' + i + '-item');
      var circle = item.querySelector('.step-circle');
      if (i < n)        { item.className = 'step-item done';   circle.textContent = '✓'; }
      else if (i === n) { item.className = 'step-item active'; circle.textContent = labels[i]; }
      else              { item.className = 'step-item';        circle.textContent = labels[i]; }
    }
  }

  // ── LOGIN CHECK ──
  function isLoggedIn() { return sessionStorage.getItem('sns_user') !== null; }

  function showLoginPrompt() {
    sessionStorage.setItem('sns_pending_pitch', SNS.selectedPitch ? (SNS.selectedPitch._id || SNS.selectedPitch.id) : '');
    sessionStorage.setItem('sns_pending_slot', SNS.selectedSlot !== null ? SNS.selectedSlot : '');
    document.getElementById('loginPrompt').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLoginPrompt() {
    document.getElementById('loginPrompt').classList.remove('open');
    document.body.style.overflow = '';
  }
  window.closeLoginPrompt = closeLoginPrompt;

  // ── OPEN PAY MODAL ──
  function openPayModal() {
    if (!SNS.selectedPitch || SNS.selectedSlot === null) return;
    if (!isLoggedIn()) { showLoginPrompt(); return; }

    var name    = document.getElementById('userName').value.trim();
    var phone   = document.getElementById('userPhone').value.trim();
    var count   = document.getElementById('userCount').value;
    var note    = document.getElementById('userNote').value.trim();
    var dateStr = SNS.selectedDate ? toJalaliString(SNS.selectedDate) : '—';
    var slotStr = getSlotTime();

    document.getElementById('modalSummary').innerHTML =
      '<div class="modal-row"><span class="ml">زمین</span><span class="mr">' + SNS.selectedPitch.name + '</span></div>' +
      '<div class="modal-row"><span class="ml">نوع</span><span class="mr">' + SNS.typeLabel[SNS.selectedPitch.type] + '</span></div>' +
      '<div class="modal-row"><span class="ml">تاریخ</span><span class="mr">' + dateStr + '</span></div>' +
      '<div class="modal-row"><span class="ml">ساعت</span><span class="mr">' + slotStr + '</span></div>' +
      '<div class="modal-row"><span class="ml">رزروکننده</span><span class="mr">' + name + '</span></div>' +
      '<div class="modal-row"><span class="ml">موبایل</span><span class="mr">' + phone + '</span></div>' +
      '<div class="modal-row"><span class="ml">نفرات</span><span class="mr">' + count + '</span></div>' +
      (note ? '<div class="modal-row"><span class="ml">توضیحات</span><span class="mr">' + note + '</span></div>' : '') +
      '<div class="modal-row total"><span class="ml">مبلغ کل</span><span class="mr">' + priceFaWords(getSlotPrice()) + '</span></div>';

    document.getElementById('payModal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  window.openPayModal = openPayModal;

  // ── CLOSE PAY MODAL ──
  function closePayModal() {
    document.getElementById('payModal').classList.remove('open');
    document.body.style.overflow = '';
  }
  window.closePayModal = closePayModal;

  // ── DO PAYMENT ──
  async function doPayment() {
    if (!SNS.selectedPitch || SNS.selectedSlot === null) return;
    var name    = document.getElementById('userName').value.trim();
    var phone   = document.getElementById('userPhone').value.trim();
    var count   = document.getElementById('userCount').value;
    var dateStr = SNS.selectedDate ? toJalaliString(SNS.selectedDate) : '—';

    var payBtn = document.querySelector('.pay-btn');
    if (payBtn) { payBtn.disabled = true; payBtn.textContent = 'در حال ثبت رزرو...'; }

    var slotStr   = getSlotTime();
    var pitchType = SNS.typeLabel[SNS.selectedPitch.type] + ' · ' + numFa(SNS.selectedPitch.size) + ' نفره';

    // تلاش برای ثبت در API (اگه بک‌اند روشن باشه)
    try {
      var token = sessionStorage.getItem('sns_token');
      var controller = new AbortController();
      setTimeout(() => controller.abort(), 3000);
      var res = await fetch(SNS.API + '/reservations', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || '') },
        body: JSON.stringify({
          pitchId:     SNS.selectedPitch._id || SNS.selectedPitch.id,
          slotIndex:   SNS.selectedSlot,
          date:        dateStr,
          playerCount: parseInt(count),
          note:        document.getElementById('userNote').value.trim(),
        })
      });
      var data = await res.json();
      if (data.success) {
        closePayModal();
        var params = new URLSearchParams({
          reservationId: data.reservation.id,
          pitchName: SNS.selectedPitch.name, pitchType, date: dateStr,
          time: slotStr, name, phone, count, amount: getSlotPrice(),
        });
        window.location.href = './payment.html?' + params.toString();
        return;
      }
    } catch (e) { /* بک‌اند وصل نیست - ادامه با mock */ }

    // حالت mock (بدون بک‌اند)
    closePayModal();
    var resId = 'mock-' + Date.now();
    var code  = 'SNS-' + Math.random().toString(36).substr(2,6).toUpperCase();

    // ذخیره رزرو pending قبل از رفتن به payment
    var existing = JSON.parse(sessionStorage.getItem('sns_mock_reservations') || '[]');
    existing.unshift({
      id: resId, code,
      pitch: SNS.selectedPitch.name,
      pitchName: SNS.selectedPitch.name,
      slotTime: slotStr, date: dateStr,
      playerCount: parseInt(count) || 0,
      amount: getSlotPrice(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    sessionStorage.setItem('sns_mock_reservations', JSON.stringify(existing.slice(0, 20)));

    // علامت‌گذاری slot به عنوان رزرو شده در localStorage
    var takenKey = 'sns_taken_slots';
    var taken = JSON.parse(localStorage.getItem(takenKey) || '{}');
    var pid = SNS.selectedPitch._id || SNS.selectedPitch.id;
    if (!taken[pid]) taken[pid] = [];
    if (!taken[pid].includes(SNS.selectedSlot)) taken[pid].push(SNS.selectedSlot);
    localStorage.setItem(takenKey, JSON.stringify(taken));

    var params = new URLSearchParams({
      reservationId: resId, code,
      pitchName: SNS.selectedPitch.name, pitchType, date: dateStr,
      time: slotStr, name, phone, count, amount: getSlotPrice(),
    });
    window.location.href = './payment.html?' + params.toString();
  }
  window.doPayment = doPayment;

  // ── CLOSE ON OVERLAY CLICK ──
  document.addEventListener('click', function(e) {
    if (e.target.id === 'payModal') closePayModal();
    if (e.target.id === 'loginPrompt') closeLoginPrompt();
  });

  // ── INIT ──
  document.addEventListener('DOMContentLoaded', async function() {
    SNS.selectedDate = new Date();
    document.getElementById('dateFilter').value = toJalaliString(SNS.selectedDate);
    document.getElementById('userName').addEventListener('input', checkSubmit);
    document.getElementById('userPhone').addEventListener('input', checkSubmit);

    // آپدیت navbar اگه لاگین بود
    var user = sessionStorage.getItem('sns_user');
    var loginBtn = document.querySelector('.header .btn');
    if (user && loginBtn) {
      loginBtn.textContent = 'حساب من';
      loginBtn.href = './profile.html';
      loginBtn.style.background = 'transparent';
      loginBtn.style.color = 'var(--green)';
      loginBtn.style.border = '1.5px solid var(--green)';
      loginBtn.style.boxShadow = 'none';
    }

    await loadPitches();
  });

} // end reserve page block