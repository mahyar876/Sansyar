// =========================
// SHARED UTILITIES
// =========================
function numFa(n) {
  return n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
}
function priceFa(n) {
  return numFa(n.toLocaleString('en'));
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
      const opts = { weekday:'long', month:'long', day:'numeric' };
      dateEl.textContent = new Date().toLocaleDateString('fa-IR', opts);
    } catch(e) {}
  })();
}

// =========================
// RESERVE PAGE ONLY
// =========================
if (document.getElementById('pitchesGrid')) {

  // ── GLOBAL STATE (قابل دسترس از همه جا) ──
  window.SNS = {
    API:           'http://localhost:5000/api',
    typeLabel:     { futsal: 'فوتسال', grass: 'چمن' },
    pitches:       [],
    filteredList:  [],
    selectedPitch: null,
    selectedSlot:  null,
  };

  const slotTimes = [
    '۰۸:۰۰–۰۹:۰۰','۰۹:۰۰–۱۰:۰۰','۱۰:۰۰–۱۱:۰۰','۱۱:۰۰–۱۲:۰۰',
    '۱۴:۰۰–۱۵:۰۰','۱۵:۰۰–۱۶:۰۰','۱۶:۰۰–۱۷:۰۰','۱۷:۰۰–۱۸:۰۰',
    '۱۸:۰۰–۱۹:۰۰','۱۹:۰۰–۲۰:۰۰','۲۰:۰۰–۲۱:۰۰','۲۱:۰۰–۲۲:۰۰',
  ];

  // ── STATIC FALLBACK DATA (وقتی بک‌اند آفلاینه) ──
  const STATIC_PITCHES = [
    {
      id: '1', name: 'سالن فوتسال آریا', type: 'futsal', size: 5,
      price: 180000, avail: 6, color1: '#0d3320', color2: '#051a0e',
      tags: ['سرپوشیده', 'رختکن', 'کفپوش PVC', 'نور مصنوعی'],
      address: 'خیابان ولیعصر، نرسیده به میدان ونک',
      slots: [
        {time:'۰۸:۰۰–۰۹:۰۰',taken:false},{time:'۰۹:۰۰–۱۰:۰۰',taken:false},
        {time:'۱۰:۰۰–۱۱:۰۰',taken:false},{time:'۱۱:۰۰–۱۲:۰۰',taken:false},
        {time:'۱۴:۰۰–۱۵:۰۰',taken:false},{time:'۱۵:۰۰–۱۶:۰۰',taken:false},
        {time:'۱۶:۰۰–۱۷:۰۰',taken:false},{time:'۱۷:۰۰–۱۸:۰۰',taken:false},
        {time:'۱۸:۰۰–۱۹:۰۰',taken:false},{time:'۱۹:۰۰–۲۰:۰۰',taken:false},
        {time:'۲۰:۰۰–۲۱:۰۰',taken:false},{time:'۲۱:۰۰–۲۲:۰۰',taken:false},
      ]
    },
    {
      id: '2', name: 'چمن فوتبال پارک ملت', type: 'grass', size: 11,
      price: 320000, avail: 3, color1: '#0a2e10', color2: '#040f06',
      tags: ['چمن مصنوعی', 'روشنایی شبانه', 'پارکینگ', 'تریبون'],
      address: 'پارک ملت، بلوار کشاورز',
      slots: [
        {time:'۰۸:۰۰–۰۹:۰۰',taken:true},{time:'۰۹:۰۰–۱۰:۰۰',taken:true},
        {time:'۱۰:۰۰–۱۱:۰۰',taken:true},{time:'۱۱:۰۰–۱۲:۰۰',taken:false},
        {time:'۱۴:۰۰–۱۵:۰۰',taken:true},{time:'۱۵:۰۰–۱۶:۰۰',taken:true},
        {time:'۱۶:۰۰–۱۷:۰۰',taken:true},{time:'۱۷:۰۰–۱۸:۰۰',taken:true},
        {time:'۱۸:۰۰–۱۹:۰۰',taken:false},{time:'۱۹:۰۰–۲۰:۰۰',taken:false},
        {time:'۲۰:۰۰–۲۱:۰۰',taken:true},{time:'۲۱:۰۰–۲۲:۰۰',taken:true},
      ]
    },
    {
      id: '3', name: 'فوتسال ستاره شرق', type: 'futsal', size: 7,
      price: 210000, avail: 8, color1: '#0d2e1a', color2: '#060f08',
      tags: ['سرپوشیده', 'دوش', 'نوشیدنی', 'وای‌فای'],
      address: 'نارمک، خیابان دماوند',
      slots: [
        {time:'۰۸:۰۰–۰۹:۰۰',taken:false},{time:'۰۹:۰۰–۱۰:۰۰',taken:false},
        {time:'۱۰:۰۰–۱۱:۰۰',taken:false},{time:'۱۱:۰۰–۱۲:۰۰',taken:false},
        {time:'۱۴:۰۰–۱۵:۰۰',taken:true},{time:'۱۵:۰۰–۱۶:۰۰',taken:false},
        {time:'۱۶:۰۰–۱۷:۰۰',taken:false},{time:'۱۷:۰۰–۱۸:۰۰',taken:false},
        {time:'۱۸:۰۰–۱۹:۰۰',taken:true},{time:'۱۹:۰۰–۲۰:۰۰',taken:false},
        {time:'۲۰:۰۰–۲۱:۰۰',taken:false},{time:'۲۱:۰۰–۲۲:۰۰',taken:false},
      ]
    },
    {
      id: '4', name: 'زمین چمن رضایی', type: 'grass', size: 7,
      price: 250000, avail: 4, color1: '#082510', color2: '#030c05',
      tags: ['چمن طبیعی', 'تریبون', 'بوفه', 'رختکن'],
      address: 'تهران پارس، خیابان شکوفه',
      slots: [
        {time:'۰۸:۰۰–۰۹:۰۰',taken:true},{time:'۰۹:۰۰–۱۰:۰۰',taken:true},
        {time:'۱۰:۰۰–۱۱:۰۰',taken:false},{time:'۱۱:۰۰–۱۲:۰۰',taken:true},
        {time:'۱۴:۰۰–۱۵:۰۰',taken:true},{time:'۱۵:۰۰–۱۶:۰۰',taken:true},
        {time:'۱۶:۰۰–۱۷:۰۰',taken:true},{time:'۱۷:۰۰–۱۸:۰۰',taken:true},
        {time:'۱۸:۰۰–۱۹:۰۰',taken:false},{time:'۱۹:۰۰–۲۰:۰۰',taken:true},
        {time:'۲۰:۰۰–۲۱:۰۰',taken:false},{time:'۲۱:۰۰–۲۲:۰۰',taken:false},
      ]
    },
    {
      id: '5', name: 'سالن ورزشی امید', type: 'futsal', size: 5,
      price: 160000, avail: 5, color1: '#0d3320', color2: '#051a0e',
      tags: ['سرپوشیده', 'رختکن', 'مربی آزاد'],
      address: 'صادقیه، خیابان آیت‌الله کاشانی',
      slots: [
        {time:'۰۸:۰۰–۰۹:۰۰',taken:false},{time:'۰۹:۰۰–۱۰:۰۰',taken:true},
        {time:'۱۰:۰۰–۱۱:۰۰',taken:false},{time:'۱۱:۰۰–۱۲:۰۰',taken:true},
        {time:'۱۴:۰۰–۱۵:۰۰',taken:true},{time:'۱۵:۰۰–۱۶:۰۰',taken:false},
        {time:'۱۶:۰۰–۱۷:۰۰',taken:false},{time:'۱۷:۰۰–۱۸:۰۰',taken:true},
        {time:'۱۸:۰۰–۱۹:۰۰',taken:false},{time:'۱۹:۰۰–۲۰:۰۰',taken:false},
        {time:'۲۰:۰۰–۲۱:۰۰',taken:true},{time:'۲۱:۰۰–۲۲:۰۰',taken:false},
      ]
    },
    {
      id: '6', name: 'چمن فوتبال دانشگاه', type: 'grass', size: 11,
      price: 280000, avail: 2, color1: '#0a2e10', color2: '#040f06',
      tags: ['چمن مصنوعی', 'روشنایی شبانه', 'دوربین'],
      address: 'انقلاب، محوطه دانشگاه تهران',
      slots: [
        {time:'۰۸:۰۰–۰۹:۰۰',taken:true},{time:'۰۹:۰۰–۱۰:۰۰',taken:true},
        {time:'۱۰:۰۰–۱۱:۰۰',taken:true},{time:'۱۱:۰۰–۱۲:۰۰',taken:true},
        {time:'۱۴:۰۰–۱۵:۰۰',taken:true},{time:'۱۵:۰۰–۱۶:۰۰',taken:true},
        {time:'۱۶:۰۰–۱۷:۰۰',taken:true},{time:'۱۷:۰۰–۱۸:۰۰',taken:true},
        {time:'۱۸:۰۰–۱۹:۰۰',taken:true},{time:'۱۹:۰۰–۲۰:۰۰',taken:true},
        {time:'۲۰:۰۰–۲۱:۰۰',taken:false},{time:'۲۱:۰۰–۲۲:۰۰',taken:false},
      ]
    },
  ];

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
    try {
      const type = document.getElementById('typeFilter').value;
      const size = document.getElementById('sizeFilter').value;
      const sort = document.getElementById('sortFilter').value;

      const params = new URLSearchParams();
      if (type) params.set('type', type);
      if (size && size !== '0') params.set('size', size);
      if (sort) params.set('sort', sort);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const res  = await fetch(SNS.API + '/pitches?' + params, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      SNS.pitches      = data.pitches;
      SNS.filteredList = data.pitches.slice();
      renderPitches();

    } catch (err) {
      // بک‌اند آفلاینه — از داده‌های static استفاده کن
      console.warn('بک‌اند در دسترس نیست، از داده‌های محلی استفاده میشه');
      if (!SNS._allStatic) SNS._allStatic = STATIC_PITCHES;
      SNS.pitches      = SNS._allStatic;
      SNS.filteredList = applyStaticFilter(SNS._allStatic);
      renderPitches();
    }
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
      const staticPitch = STATIC_PITCHES.find(p => p.id === pitchId || p._id === pitchId);
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
            '<div class="pitch-price">' + priceFa(p.price) + ' <span>تومان/ساعت</span></div>' +
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
    var priceK = Math.round(SNS.selectedPitch.price / 1000);

    grid.innerHTML = slots.map(function(slot, i) {
      var isTaken    = slot.taken;
      var isSelected = SNS.selectedSlot === i;
      return '<div class="slot ' + (isTaken ? 'slot-taken' : '') + ' ' + (isSelected ? 'slot-selected' : '') + '" ' +
        (isTaken ? '' : 'onclick="selectSlot(' + i + ')"') + '>' +
        '<span class="slot-time">' + slot.time + '</span>' +
        '<span class="slot-price">' + (isTaken ? 'رزرو شده' : numFa(priceK) + 'K') + '</span>' +
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

  // ── UPDATE SUMMARY ──
  function updateSummary() {
    var el = document.getElementById('summaryContent');
    if (!SNS.selectedPitch) {
      el.innerHTML = '<div class="summary-empty">هنوز زمینی انتخاب نشده</div>';
      return;
    }
    var dateVal = document.getElementById('dateFilter').value;
    var dateStr = 'انتخاب نشده';
    if (dateVal) { try { dateStr = new Date(dateVal).toLocaleDateString('fa-IR'); } catch(e) { dateStr = dateVal; } }
    var slotStr = getSlotTime();
    el.innerHTML =
      '<div class="summary-row"><span class="label">زمین</span><span class="value">' + SNS.selectedPitch.name + '</span></div>' +
      '<div class="summary-row"><span class="label">نوع</span><span class="value">' + SNS.typeLabel[SNS.selectedPitch.type] + '</span></div>' +
      '<div class="summary-row"><span class="label">تاریخ</span><span class="value">' + dateStr + '</span></div>' +
      '<div class="summary-row"><span class="label">ساعت</span><span class="value">' + slotStr + '</span></div>' +
      '<div class="summary-row"><span class="label">مبلغ</span><span class="value green">' + priceFa(SNS.selectedPitch.price) + ' تومان</span></div>';
    checkSubmit();
  }

  // ── APPLY FILTER ──
  async function applyFilter() {
    // اگه داده‌های static لود شدن، فیلتر محلی بزن (بدون fetch جدید)
    if (SNS._allStatic) {
      SNS.filteredList = applyStaticFilter(SNS._allStatic);
      renderPitches();
    } else {
      await loadPitches();
    }

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
    var dateVal = document.getElementById('dateFilter').value;
    var dateStr = '—';
    if (dateVal) { try { dateStr = new Date(dateVal).toLocaleDateString('fa-IR'); } catch(e) { dateStr = dateVal; } }
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
      '<div class="modal-row total"><span class="ml">مبلغ کل</span><span class="mr">' + priceFa(SNS.selectedPitch.price) + ' تومان</span></div>';

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
    var dateVal = document.getElementById('dateFilter').value;
    var dateStr = '—';
    if (dateVal) { try { dateStr = new Date(dateVal).toLocaleDateString('fa-IR'); } catch(e) { dateStr = dateVal; } }

    var payBtn = document.querySelector('.pay-btn');
    if (payBtn) { payBtn.disabled = true; payBtn.textContent = 'در حال ثبت رزرو...'; }

    try {
      var token = sessionStorage.getItem('sns_token');
      var res   = await fetch(SNS.API + '/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({
          pitchId:     SNS.selectedPitch._id || SNS.selectedPitch.id,
          slotIndex:   SNS.selectedSlot,
          date:        dateStr,
          playerCount: parseInt(count),
          note:        document.getElementById('userNote').value.trim(),
        })
      });
      var data = await res.json();
      if (!data.success) throw new Error(data.message);

      closePayModal();
      var slotStr   = getSlotTime();
      var pitchType = SNS.typeLabel[SNS.selectedPitch.type] + ' · ' + numFa(SNS.selectedPitch.size) + ' نفره';
      var params = new URLSearchParams({
        reservationId: data.reservation.id,
        pitchName:     SNS.selectedPitch.name,
        pitchType:     pitchType,
        date:          dateStr,
        time:          slotStr,
        name:          name,
        phone:         phone,
        count:         count,
        amount:        SNS.selectedPitch.price,
      });
      window.location.href = './payment.html?' + params.toString();

    } catch (err) {
      if (payBtn) { payBtn.disabled = false; payBtn.textContent = 'پرداخت آنلاین 🔒'; }
      alert(err.message || 'خطا در ثبت رزرو');
    }
  }
  window.doPayment = doPayment;

  // ── CLOSE ON OVERLAY CLICK ──
  document.addEventListener('click', function(e) {
    if (e.target.id === 'payModal') closePayModal();
    if (e.target.id === 'loginPrompt') closeLoginPrompt();
  });

  // ── INIT ──
  document.addEventListener('DOMContentLoaded', async function() {
    var today = new Date().toISOString().split('T')[0];
    document.getElementById('dateFilter').value = today;
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
