/**
 * APEX FITNESS — REPUTATION, NFC ACCESS, CCTV & SOP PLATFORM
 * Dasturchi-Muhandislik arxitekturasi:
 * - Role-Based Authentication (Admin, Manager, Security, Client)
 * - NFC Smart Access Engine (Web NFC API + Synthesized Audio & Visual Turnstile)
 * - 50 Smart Lockers Matrix with Real-time Occupancy
 * - 4-Channel AI CCTV Surveillance Engine (HTML5 Canvas Real-time Generation + Webcam Support)
 * - 3-Step Feedback Loop CRM System with 5-min Escalation Countdown
 * - Interactive Staff SOP Conflict Resolution Simulator
 * - Dynamic Daily Occupancy Analytics (Chart.js)
 */

// ==========================================
// 1. STATE & DATA STORE
// ==========================================
const AppState = {
  currentUser: null, // { username, name, role: 'admin' | 'manager' | 'security' | 'client' }
  activeTab: 'client-portal',
  selectedNfcCardType: 'vip',
  activeLockerGender: 'male',
  selectedLockerId: 1,
  
  // 50 Lockers (25 male, 25 female)
  lockers: [],

  // CRM Complaints (Initial realistic crisis complaints)
  complaints: [
    {
      id: 'APEX-101',
      clientName: 'Azamat Qosimov',
      phone: '+998 90 123 45 67',
      category: 'gavjumlik',
      source: 'Google Maps (1 yulduz)',
      time: '15 daqiqa oldin',
      message: 'Kechqurun soat 18:30 da keldim, zalda odam juda ko\'p, birorta ham bo\'sh shkaf yo\'q edi. Administrator esa "kuting yoki buyumingizni qo\'lda olib yuring" deb qo\'pollik qildi. Shu ham xizmatmi?!',
      step: 1, // 1: ochiq e'tirof, 2: shaxsiy muloqot/bonus, 3: hal qilingan
      publicReply: '',
      compensation: '',
      status: 'pending',
      escalationTimeSec: 220 // countdown
    },
    {
      id: 'APEX-102',
      clientName: 'Nodira Karimova',
      phone: '+998 93 987 65 43',
      category: 'narx',
      source: 'Instagram Sharh',
      time: '42 daqiqa oldin',
      message: 'Abonement narxini 790 ming so\'m qilib qo\'yibsizlar. Boshqa zallar 400 ming so\'m. Nima uchun bunchalik qimmatligini umuman tushunmadim, ortiqcha hech narsa yo\'q!',
      step: 1,
      publicReply: '',
      compensation: '',
      status: 'pending',
      escalationTimeSec: 110
    },
    {
      id: 'APEX-103',
      clientName: 'Jasur Bekmurodov',
      phone: '+998 97 555 12 34',
      category: 'xodim',
      source: 'Yandex Xaritalar (1 yulduz)',
      time: '1 soat oldin',
      message: 'Murabbiylar faqat o\'z tanishlariga qaraydi, yangi kelganlarga esa qo\'pol javob beradi. Mashg\'ulot qilish madaniyati yo\'q.',
      step: 2,
      publicReply: 'Hurmatli Jasur! Vaziyat uchun chuqur uzr so\'raymiz. Biz har bir mijozimizga birdek hurmat bilan yondashamiz. Siz bilan shaxsiy chatda bog\'lanmoqdamiz.',
      compensation: '1 soatlik bepul shaxsiy murabbiy mashg\'uloti',
      status: 'in-progress',
      escalationTimeSec: 0
    },
    {
      id: 'APEX-104',
      clientName: 'Malika Umarova',
      phone: '+998 99 333 44 55',
      category: 'tozalik',
      source: 'Telegram Bot',
      time: '2 soat oldin',
      message: 'Ayollar dush xonasida suv bosimi past va sochiqlar vaqtida yangilanmagan.',
      step: 3,
      publicReply: 'Malika xonim, xabaringiz uchun rahmat! Muammo 20 daqiqada santexniklarimiz tomonidan to\'liq bartaraf etildi.',
      compensation: 'Keyingi oylik to\'lovga 20% keshbek vaucheri',
      status: 'resolved',
      escalationTimeSec: 0
    }
  ],

  selectedTicketId: 'APEX-101',

  // SOP Interactive Simulation Questions
  sopScore: 100,
  currentSimIndex: 0,
  sopScenarios: [
    {
      question: "Soat 18:45 (eng tig'iz payt). Mijoz zalga kirmoqchi bo'ldi, lekin turniket ochilmadi. U asabiylashib: 'Har oy 800 ming to'layman, nima uchun bu turniket ishlamaydi?! Hamma narsangiz buzilgan!' deb baqirmoqda. SOP bo'yicha to'g'ri reaksiyangiz qanday?",
      options: [
        {
          text: "Ovozingizni ko'tarib: 'Hurmatli mijoz, baqirmang! Turniket kartangizni o'qimayapti, xohlasangiz qo'lda tekshiraman' deb e'tiroz bildirish.",
          correct: false,
          feedback: "Noto'g'ri! 1-qoidani buzasiz: mijoz ovozini ko'targanda xodim aslo ovozini ko'tarmasligi va bahslashmasligi kerak."
        },
        {
          text: "Vazmin va past ovozda: 'Sizni to'liq tushundim, noqulaylik uchun uzr so'rayman. Hoziroq kartangizni qo'lda faollashtiraman va zalga kiritaman, 1 daqiqa vaqtingizni olaman' deb muammoni joyida hal qilish.",
          correct: true,
          feedback: "A'lo darajada! 1-qoida ('Ovozni ko'tarmaslik va tinglash') va 2-qoida ('Shaxsan qabul qilmaslik') to'liq qo'llanildi."
        },
        {
          text: "'Bu mening aybim emas, IT mutaxassislarimizga ayting' deb kutishni taklif qilish.",
          correct: false,
          feedback: "Qo'pol xato! Bu mijozning g'azabini yanada oshiradi va brend obro'sini tushiradi."
        }
      ]
    },
    {
      question: "Kechqurun soat 19:10 da barcha shkaflar to'lib ketdi. Yangi kelgan mijoz yechinishga joy topa olmay administrator oldiga g'azab bilan keldi. Qaysi harakat to'g'ri?",
      options: [
        {
          text: "'Kechki payt odam ko'p bo'lishini hamma biladi, yarim soat kuting, kimdir chiqib ketadi' deyish.",
          correct: false,
          feedback: "Mijozni mensimaslik va muammoni hal qilmaslik."
        },
        {
          text: "Uzr so'rab, darhol 2-zaxira VIP xonasini ochish va mijozga bepul fit-bar ichimligini taklif qilib, 5 daqiqada joy bilan ta'minlash.",
          correct: true,
          feedback: "To'g'ri! Zaxira resurslari ishga solindi va darhol mijoz noroziligi bartaraf etildi."
        },
        {
          text: "Mijozga kiyimlarini sport sumkasida zal ichiga olib kirishni maslahat berish.",
          correct: false,
          feedback: "Noto'g'ri! Bu zal tartib-qoidalarini va gigiyena talablarini buzadi."
        }
      ]
    },
    {
      question: "Mijoz zalning narxi juda qimmatligidan shikoyat qilib, chegirma talab qilmoqda va sotuv bo'limi xodimini haqorat qila boshladi. SOP 3-qoidasi bo'yicha nima qilish kerak?",
      options: [
        {
          text: "Mijozga nisbatan xavfsizlik chaqirib zalni tark etishini talab qilish.",
          correct: false,
          feedback: "Vaziyatni yanada keskinlashtiradi. Faqat jismoniy xavf bo'lgandagina qo'llanadi."
        },
        {
          text: "Vaziyatni shaxsan qabul qilmasdan, xotirjamlik bilan premium xizmatlar (uskunalar, murabbiylar, tozalik) qiymatini tushuntirish va Off-Peak tarifini yoki keshbek dasturini taklif qilish, hal bo'lmasa 5 daqiqada menejerga eskalatsiya qilish.",
          correct: true,
          feedback: "Mukammal! Narx siyosati tushuntirildi va eskalatsiya qoidasiga amal qilindi."
        }
      ]
    }
  ]
};

// ==========================================
// 2. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initLockersData();
  renderLockers();
  renderCrmTickets();
  renderSelectedTicket();
  renderSopScenario();
  initOccupancyChart();
  initCctvSimulation();
  startClock();
  checkSavedAuth();
  startEscalationTimer();
});

// Real-time Clock
function startClock() {
  const clockEl = document.getElementById('liveClock');
  const update = () => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    if (clockEl) clockEl.innerText = timeStr;

    // Update CCTV timestamps
    const dateStr = now.toISOString().slice(0, 10);
    ['camTime1', 'camTime2', 'camTime3', 'camTime4'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerText = `${dateStr} ${timeStr}`;
    });
  };
  update();
  setInterval(update, 1000);
}

// ==========================================
// 3. BACKEND API, AUTHENTICATION & RBAC
// ==========================================
const API_BASE = window.location.protocol.startsWith('http') ? window.location.origin : 'http://localhost:3000';
let currentAuthToken = localStorage.getItem('apex_token') || null;

function checkSavedAuth() {
  const savedUser = localStorage.getItem('apex_user');
  if (savedUser) {
    try {
      AppState.currentUser = JSON.parse(savedUser);
      applyRbacPanels();
      updateAuthUI();
    } catch (e) {
      console.error(e);
    }
  }
}

function openLoginModal() {
  document.getElementById('loginModal').classList.remove('hidden');
}

function closeLoginModal() {
  document.getElementById('loginModal').classList.add('hidden');
}

function switchAuthMode(mode) {
  const btnLogin = document.getElementById('btnAuthModeLogin');
  const btnRegister = document.getElementById('btnAuthModeRegister');
  const formLogin = document.getElementById('authLoginForm');
  const formRegister = document.getElementById('authRegisterForm');
  const title = document.getElementById('authModalTitle');

  if (mode === 'register') {
    btnLogin.className = 'flex-1 py-2 rounded-lg font-bold text-slate-400 hover:text-white transition-all';
    btnRegister.className = 'flex-1 py-2 rounded-lg font-bold bg-orange-600 text-white transition-all';
    formLogin.classList.add('hidden');
    formRegister.classList.remove('hidden');
    title.innerText = 'Yangi A\'zo Ro\'yxatdan O\'tishi';
  } else {
    btnRegister.className = 'flex-1 py-2 rounded-lg font-bold text-slate-400 hover:text-white transition-all';
    btnLogin.className = 'flex-1 py-2 rounded-lg font-bold bg-orange-600 text-white transition-all';
    formRegister.classList.add('hidden');
    formLogin.classList.remove('hidden');
    title.innerText = 'Apex Fitness Xavfsiz Tizimi';
  }
}

function fillLoginCredentials(username, password) {
  switchAuthMode('login');
  document.getElementById('loginUsername').value = username;
  document.getElementById('loginPassword').value = password;
}

// REST API: Login Request
async function handleAuthLogin(e) {
  e.preventDefault();
  const u = document.getElementById('loginUsername').value.trim();
  const p = document.getElementById('loginPassword').value.trim();

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });

    const data = await res.json();

    if (data.success && data.user) {
      currentAuthToken = data.token;
      AppState.currentUser = data.user;
      localStorage.setItem('apex_token', data.token);
      localStorage.setItem('apex_user', JSON.stringify(data.user));

      closeLoginModal();
      applyRbacPanels();
      updateAuthUI();
      showToast(`Xush kelibsiz, ${data.user.name} (${data.user.roleLabel})!`, 'success');
      return;
    } else {
      showToast(data.message || 'Login yoki parol xato!', 'error');
    }
  } catch (err) {
    // OFFLINE FALLBACK CREDENTIALS
    console.warn('Backend server bilan bog\'lanishda xatolik, oflayn rejim ishlatilmoqda:', err);
    offlineAuthLoginFallback(u, p);
  }
}

// Offline fallback credentials if server is not directly reached
function offlineAuthLoginFallback(u, p) {
  let matchedUser = null;
  if (u === 'admin' && p === 'Admin@Apex2026!') {
    matchedUser = {
      username: 'admin', name: 'Sardor Rahimov', role: 'admin', roleLabel: 'Super Admin',
      allowedPanels: ['client-portal', 'nfc-lockers', 'cctv-surveillance', 'reputation-crm', 'staff-sop', 'pricing-value', 'audit-security'],
      nfcCard: 'APEX-NFC-ADMIN-01', balance: 0, cashback: 0
    };
  } else if (u === 'manager' && p === 'Manager@Apex2026!') {
    matchedUser = {
      username: 'manager', name: 'Zilola Saidova', role: 'manager', roleLabel: 'Mijozlar bilan ishlash Menejeri',
      allowedPanels: ['client-portal', 'reputation-crm', 'staff-sop', 'pricing-value'],
      nfcCard: 'APEX-NFC-MGR-02', balance: 0, cashback: 0
    };
  } else if (u === 'security' && p === 'Security@Apex2026!') {
    matchedUser = {
      username: 'security', name: 'Bobur Mirzayev', role: 'security', roleLabel: 'Xavfsizlik Xizmati',
      allowedPanels: ['client-portal', 'nfc-lockers', 'cctv-surveillance'],
      nfcCard: 'APEX-NFC-SEC-03', balance: 0, cashback: 0
    };
  } else if (u === 'user1' && p === 'User@Apex2026!') {
    matchedUser = {
      username: 'user1', name: 'Sardor Aliyev', role: 'user', roleLabel: 'VIP Platinum Mijoz',
      allowedPanels: ['client-portal', 'nfc-lockers', 'pricing-value'],
      nfcCard: 'APEX-NFC-8821-UZ', lockerId: 24, membership: 'VIP Platinum', balance: 800000, cashback: 180000
    };
  } else if (u === 'user2' && p === 'User@Apex2026!') {
    matchedUser = {
      username: 'user2', name: 'Malika Umarova', role: 'user', roleLabel: 'Standart Fit Mijoz',
      allowedPanels: ['client-portal', 'nfc-lockers', 'pricing-value'],
      nfcCard: 'APEX-NFC-4109-UZ', lockerId: 7, membership: 'Morning & Day Fit', balance: 490000, cashback: 45000
    };
  }

  if (matchedUser) {
    AppState.currentUser = matchedUser;
    localStorage.setItem('apex_user', JSON.stringify(matchedUser));
    closeLoginModal();
    applyRbacPanels();
    updateAuthUI();
    showToast(`Xush kelibsiz, ${matchedUser.name} (${matchedUser.roleLabel})!`, 'success');
  } else {
    showToast('Login yoki parol noto\'g\'ri! Tayyor hisoblardan birini bosing.', 'error');
  }
}

// REST API: Register Request
async function handleAuthRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regFullName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const username = document.getElementById('regUsername').value.trim().toLowerCase();
  const password = document.getElementById('regPassword').value.trim();

  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, username, password })
    });
    const data = await res.json();

    if (data.success && data.user) {
      currentAuthToken = data.token;
      AppState.currentUser = data.user;
      localStorage.setItem('apex_token', data.token);
      localStorage.setItem('apex_user', JSON.stringify(data.user));

      closeLoginModal();
      applyRbacPanels();
      updateAuthUI();
      showToast(data.message, 'success');
      return;
    } else {
      showToast(data.message || 'Ro\'yxatdan o\'tishda xatolik!', 'error');
    }
  } catch (err) {
    // Offline registration fallback
    const newCard = 'APEX-NFC-' + Math.floor(Math.random() * 9000 + 1000) + '-UZ';
    const newUser = {
      username, name, role: 'user', roleLabel: 'Yangi A\'zo (Smart NFC)',
      allowedPanels: ['client-portal', 'nfc-lockers', 'pricing-value'],
      nfcCard: newCard, lockerId: null, membership: 'Standart Fit', balance: 0, cashback: 50000
    };
    AppState.currentUser = newUser;
    localStorage.setItem('apex_user', JSON.stringify(newUser));
    closeLoginModal();
    applyRbacPanels();
    updateAuthUI();
    showToast(`Tabriklaymiz, ${name}! Virtual NFC karta berildi: ${newCard}`, 'success');
  }
}

// Logout
async function logoutUser() {
  if (currentAuthToken) {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentAuthToken}` }
      });
    } catch (e) {}
  }

  AppState.currentUser = null;
  currentAuthToken = null;
  localStorage.removeItem('apex_user');
  localStorage.removeItem('apex_token');
  applyRbacPanels();
  updateAuthUI();
  switchTab('client-portal');
  showToast('Tizimdan muvaffaqiyatli chiqdingiz.', 'info');
}

// Quick Role Switcher (Directly switch and test role-based distribution)
function quickSwitchRole(roleKey) {
  if (roleKey === 'mijoz') {
    offlineAuthLoginFallback('mijoz', 'Mijoz@2026!');
  } else if (roleKey === 'security') {
    offlineAuthLoginFallback('security', 'Security@2026!');
  } else if (roleKey === 'manager') {
    offlineAuthLoginFallback('manager', 'Manager@2026!');
  } else if (roleKey === 'admin') {
    offlineAuthLoginFallback('admin', 'Admin@2026!');
  }
}

// Nav Tab Click Handler with Guest Lock Protection
function handleNavTabClick(tabId) {
  const user = AppState.currentUser;
  
  // Public tabs allowed for anyone
  if (tabId === 'client-portal' || tabId === 'pricing-value') {
    switchTab(tabId);
    return;
  }

  // Protected tabs require login
  if (!user) {
    playHardwareBeep(false);
    let requiredRole = 'Mijoz yoki Xodim';
    if (tabId === 'cctv-surveillance') requiredRole = 'Xavfsizlik Xizmati (Login: security)';
    if (tabId === 'reputation-crm' || tabId === 'staff-sop') requiredRole = 'Menejment (Login: manager)';
    if (tabId === 'nfc-lockers') requiredRole = 'Mijoz yoki Xavfsizlik (Login: mijoz)';

    showToast(`🔒 Ushbu bo'lim himoyalangan! Ruxsat: ${requiredRole}`, 'error');
    openLoginModal();
    return;
  }

  // Check if role is allowed
  if (user.allowedPanels && !user.allowedPanels.includes(tabId)) {
    playHardwareBeep(false);
    showToast(`⛔ Ruxsat berilmadi: Ushbu bo'lim sizning rolingiz (${user.roleLabel}) uchun taqiqlangan!`, 'error');
    switchTab(tabId); // Triggers 403 screen
    return;
  }

  switchTab(tabId);
}

// APPLY ROLE-BASED ACCESS CONTROL (RBAC) TO UI
function applyRbacPanels() {
  const user = AppState.currentUser;
  const role = user ? user.role : 'guest';

  // 1. Header Role Badges & Titles
  const roleBadge = document.getElementById('currentRoleHeaderBadge');
  const roleSubtext = document.getElementById('currentRoleSubtext');
  const navClientTitle = document.getElementById('navClientTitle');

  if (role === 'user') {
    if (roleBadge) {
      roleBadge.innerText = 'MIJOZ REJIMI';
      roleBadge.className = 'text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    }
    if (roleSubtext) roleSubtext.innerText = 'Mijoz shaxsiy kabineti, NFC smart pass & keshbek';
    if (navClientTitle) navClientTitle.innerText = 'Mening Kabinetim';
  } else if (role === 'security') {
    if (roleBadge) {
      roleBadge.innerText = 'XAVFSIZLIK XIZMATI';
      roleBadge.className = 'text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
    }
    if (roleSubtext) roleSubtext.innerText = 'Video nazorat CCTV (4 CAM) & Turniket datchiklari';
    if (navClientTitle) navClientTitle.innerText = 'Bosh Ekran';
  } else if (role === 'manager') {
    if (roleBadge) {
      roleBadge.innerText = 'MENEJMENT REJIMI';
      roleBadge.className = 'text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30';
    }
    if (roleSubtext) roleSubtext.innerText = 'Qayta Aloqa CRM, SOP Yo\'riqnomasi & Sifat tahlili';
    if (navClientTitle) navClientTitle.innerText = 'Boshqaruv Paneli';
  } else if (role === 'admin') {
    if (roleBadge) {
      roleBadge.innerText = 'SUPER ADMIN';
      roleBadge.className = 'text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30';
    }
    if (roleSubtext) roleSubtext.innerText = 'To\'liq tizim boshqaruvi, Audit jurnali va barcha 7 ta panel';
    if (navClientTitle) navClientTitle.innerText = 'Admin Konsol';
  } else {
    if (roleBadge) {
      roleBadge.innerText = 'MEHMON';
      roleBadge.className = 'text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300 border border-slate-600';
    }
    if (roleSubtext) roleSubtext.innerText = 'Tanishuv rejimi. To\'liq imkoniyatlar uchun tizimga kiring';
    if (navClientTitle) navClientTitle.innerText = 'Mijoz Portali';
  }

  // 2. Strict Panel Filtering: show ONLY allowed tabs for the logged-in role
  document.querySelectorAll('#mainNavContainer button[data-role]').forEach(btn => {
    const allowedRoles = btn.getAttribute('data-role').split(',');
    
    if (role === 'guest') {
      // In guest mode, only client-portal and pricing-value are visible without lock
      const tab = btn.getAttribute('data-tab');
      if (tab === 'pricing-value') {
        btn.classList.remove('hidden');
      } else {
        // Show with a lock indicator or hide
        btn.classList.remove('hidden');
      }
    } else {
      // For logged in user, show strictly allowed ones
      if (allowedRoles.includes(role)) {
        btn.classList.remove('hidden');
      } else {
        btn.classList.add('hidden');
      }
    }
  });

  // 3. Highlight active Quick Role Button in Top Bar
  ['quickRoleUser', 'quickRoleSec', 'quickRoleMgr', 'quickRoleAdmin'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.remove('ring-2', 'ring-white', 'scale-105');
  });
  if (role === 'user') document.getElementById('quickRoleUser')?.classList.add('ring-2', 'ring-white', 'scale-105');
  if (role === 'security') document.getElementById('quickRoleSec')?.classList.add('ring-2', 'ring-white', 'scale-105');
  if (role === 'manager') document.getElementById('quickRoleMgr')?.classList.add('ring-2', 'ring-white', 'scale-105');
  if (role === 'admin') document.getElementById('quickRoleAdmin')?.classList.add('ring-2', 'ring-white', 'scale-105');

  // 4. User Client Info Widget on Hero
  const clientWidget = document.getElementById('clientAccountWidget');
  if (clientWidget) {
    if (role === 'user' && user) {
      clientWidget.classList.remove('hidden');
      document.getElementById('clientStatusBadge').innerText = user.roleLabel || 'Doimiy A\'zo';
      document.getElementById('clientCashbackDisplay').innerText = (user.cashback || 0).toLocaleString() + ' so\'m';
      document.getElementById('clientBalanceDisplay').innerText = (user.balance || 0).toLocaleString() + ' so\'m';
      
      // Update Hero NFC card preview
      if (user.nfcCard) document.getElementById('heroPassId').innerText = user.nfcCard;
      if (user.membership) document.getElementById('heroMembershipName').innerText = user.membership;
      if (user.lockerId) document.getElementById('heroLockerNum').innerText = `#${user.lockerId} (Sizning shkafingiz)`;
    } else {
      clientWidget.classList.add('hidden');
    }
  }

  // 5. If current tab is forbidden, auto switch to first allowed tab
  if (user && user.allowedPanels && !user.allowedPanels.includes(AppState.activeTab)) {
    if (role === 'security') switchTab('cctv-surveillance');
    else if (role === 'manager') switchTab('reputation-crm');
    else switchTab('client-portal');
  }
}

function updateAuthUI() {
  const profileBadge = document.getElementById('userProfileBadge');
  const loginTrigger = document.getElementById('loginBtnTrigger');
  const userAvatar = document.getElementById('userAvatar');
  const userDisplayName = document.getElementById('userDisplayName');
  const userRoleBadge = document.getElementById('userRoleBadge');

  if (AppState.currentUser) {
    profileBadge.classList.remove('hidden');
    profileBadge.classList.add('flex');
    loginTrigger.classList.add('hidden');

    userAvatar.innerText = AppState.currentUser.name.charAt(0).toUpperCase();
    userDisplayName.innerText = AppState.currentUser.name;
    userRoleBadge.innerText = AppState.currentUser.roleLabel;
  } else {
    profileBadge.classList.add('hidden');
    profileBadge.classList.remove('flex');
    loginTrigger.classList.remove('hidden');
  }
}

// Tab Switching with Strict RBAC Guard
function switchTab(tabId) {
  const user = AppState.currentUser;
  const accessDeniedBanner = document.getElementById('accessDeniedBanner');
  const accessDeniedMsg = document.getElementById('accessDeniedMsg');

  // RBAC Permission Check
  if (user && user.allowedPanels && !user.allowedPanels.includes(tabId)) {
    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
    
    // Show 403 Forbidden Screen
    accessDeniedBanner.classList.remove('hidden');
    accessDeniedMsg.innerHTML = `
      Hurmatli <strong>${user.name} (${user.roleLabel})</strong>! <br>
      Siz tanlagan <strong>'${tabId}'</strong> bo'limi sizning rolingiz uchun yopiq hudud hisoblanadi. <br>
      Kamera nazorati (CCTV) faqat Xavfsizlik xizmati uchun, CRM esa faqat Menejerlar uchun ruxsat etilgan.
    `;
    playHardwareBeep(false);
    return;
  }

  // Allowed: hide 403 screen
  if (accessDeniedBanner) accessDeniedBanner.classList.add('hidden');
  AppState.activeTab = tabId;

  // Tabs UI
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  const targetPane = document.getElementById(`tab-${tabId}`);
  if (targetPane) targetPane.classList.remove('hidden');

  // Nav buttons UI
  document.querySelectorAll('.nav-tab').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active-tab');
    } else {
      btn.classList.remove('active-tab');
    }
  });

  if (tabId === 'audit-security') {
    fetchAuditLogs();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Fetch Security Audit Logs (Admin only)
async function fetchAuditLogs() {
  const tbody = document.getElementById('auditLogsTableBody');
  if (!tbody) return;

  try {
    const res = await fetch(`${API_BASE}/api/audit/logs`, {
      headers: { 'Authorization': `Bearer ${currentAuthToken}` }
    });
    const data = await res.json();

    if (data.success && data.logs) {
      renderAuditLogsTable(data.logs);
      document.getElementById('auditTotalLogsCount').innerText = `${data.logs.length} ta`;
      return;
    }
  } catch (e) {
    console.warn('Audit logs offline rendering');
  }

  // Local fallback mock logs
  const mockLogs = [
    { timestamp: new Date().toISOString(), action: 'LOGIN_SUCCESS', username: 'admin', severity: 'INFO', details: 'Bosh Administrator tizimga kirdi' },
    { timestamp: new Date(Date.now() - 120000).toISOString(), action: 'NFC_TURNSTILE_OPEN', username: 'user1', severity: 'INFO', details: 'NFC-8821 Turniket ochildi, Shkaf #24' },
    { timestamp: new Date(Date.now() - 480000).toISOString(), action: 'CCTV_VIEW', username: 'security', severity: 'INFO', details: 'Jonli 4 ta kamera nazorati boshlandi' },
    { timestamp: new Date(Date.now() - 900000).toISOString(), action: 'CRM_COMPENSATION', username: 'manager', severity: 'INFO', details: 'Mijoz Azamat Qosimovga bepul bonus biriktirildi' }
  ];
  renderAuditLogsTable(mockLogs);
}

function renderAuditLogsTable(logs) {
  const tbody = document.getElementById('auditLogsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  logs.forEach(log => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-900 transition-colors';

    let badgeClass = 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
    if (log.severity === 'WARNING') badgeClass = 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
    if (log.severity === 'CRITICAL') badgeClass = 'text-rose-400 bg-rose-500/10 border border-rose-500/20';

    tr.innerHTML = `
      <td class="py-2.5 px-4 text-slate-400 text-[11px]">${log.timestamp.slice(0, 19).replace('T', ' ')}</td>
      <td class="py-2.5 px-4 font-bold text-white">${log.action}</td>
      <td class="py-2.5 px-4 text-cyan-400">${log.username || 'SISTEMA'}</td>
      <td class="py-2.5 px-4"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}">${log.severity}</span></td>
      <td class="py-2.5 px-4 text-slate-300 text-[11px]">${log.details}</td>
    `;
    tbody.appendChild(tr);
  });
}


function toggleMobileNav() {
  const drawer = document.getElementById('mobileNavDrawer');
  drawer.classList.toggle('hidden');
}

function scrollToFeedbackForm() {
  switchTab('client-portal');
  setTimeout(() => {
    const el = document.getElementById('quickFeedbackSection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

// ==========================================
// 4. NFC SMART ACCESS & TURNSTILE ENGINE
// ==========================================

// Web Audio API: Hardware Beep Generator (No external audio file needed!)
function playHardwareBeep(success = true) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = success ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(success ? 880 : 220, audioCtx.currentTime); // A5 (high pleasant beep) or low buzz
    
    if (success) {
      // Pleasant double beep for NFC
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    } else {
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    }

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch (e) {
    console.log('AudioContext not available or blocked');
  }
}

function selectNfcCard(type) {
  AppState.selectedNfcCardType = type;
  document.querySelectorAll('.nfc-card-btn').forEach(b => {
    if (b.getAttribute('data-card') === type) {
      b.classList.add('active-nfc-card');
    } else {
      b.classList.remove('active-nfc-card');
    }
  });
}

function triggerQuickNfcTap() {
  switchTab('nfc-lockers');
  setTimeout(() => {
    tapCurrentNfcCard();
  }, 400);
}

function tapCurrentNfcCard() {
  const iconBox = document.getElementById('turnstileIconBox');
  const icon = document.getElementById('turnstileIcon');
  const ledBar = document.getElementById('turnstileLedBar');
  const msg = document.getElementById('turnstileMessage');
  const subMsg = document.getElementById('turnstileSubMessage');
  const badge = document.getElementById('turnstileStatusBadge');
  const beam = document.getElementById('scannerBeam');

  // Activate scanner beam animation
  if (beam) beam.classList.remove('hidden');

  let cardName = 'VIP Platinum (NFC-8821)';
  let lockerAssigned = 24;

  if (AppState.selectedNfcCardType === 'standard') {
    cardName = 'Standart Pass (NFC-4109)';
    lockerAssigned = 7;
  } else if (AppState.selectedNfcCardType === 'new') {
    cardName = 'Yangi Mehmon (NFC-9902)';
    // Find first free locker
    const freeLocker = AppState.lockers.find(l => l.gender === AppState.activeLockerGender && !l.isBusy);
    lockerAssigned = freeLocker ? freeLocker.id : 12;
  }

  // Hardware beep
  playHardwareBeep(true);

  // Turnstile open state
  iconBox.classList.add('turnstile-unlocked');
  icon.className = 'fa-solid fa-lock-open text-emerald-400';
  ledBar.className = 'absolute top-0 left-0 right-0 h-2 bg-emerald-500 shadow-lg shadow-emerald-500/50';
  badge.className = 'px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse';
  badge.innerText = 'RUXSAT BERILDI (OCHIQ)';

  msg.innerHTML = `<span class="text-emerald-400 font-bold">${cardName}</span> muvaffaqiyatli o'qildi!`;
  subMsg.innerHTML = `Xush kelibsiz! Sizga biriktirilgan shkaf: <strong class="text-orange-400">#${lockerAssigned < 10 ? '0' + lockerAssigned : lockerAssigned}</strong>`;

  showToast(`NFC O'qildi! Turniket ochildi. Shkaf #${lockerAssigned}`, 'success');

  // Highlight the assigned locker
  AppState.selectedLockerId = lockerAssigned;
  renderLockers();
  updateSelectedLockerCard();

  // Reset turnstile after 3.5 seconds
  setTimeout(() => {
    if (beam) beam.classList.add('hidden');
    iconBox.classList.remove('turnstile-unlocked');
    icon.className = 'fa-solid fa-lock text-slate-400';
    ledBar.className = 'absolute top-0 left-0 right-0 h-2 bg-slate-700';
    badge.className = 'px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700';
    badge.innerText = 'TIZIM TAYYOR (LOCKED)';
    msg.innerText = 'NFC kartani skanerga yaqinlashtiring';
    subMsg.innerText = 'Kechki oqim monitoringi yoqilgan';
  }, 3500);
}

// Real Web NFC API integration (Supported on Android Chrome)
async function scanRealWebNfc() {
  if ('NDEFReader' in window) {
    try {
      showToast('Smartfon NFC skaneri yoqilmoqda... Kalitni orqa panelga tekkizing.', 'info');
      const ndef = new window.NDEFReader();
      await ndef.scan();

      ndef.onreading = event => {
        const serialNumber = event.serialNumber || 'APEX-CARD-' + Math.floor(Math.random() * 9000 + 1000);
        showToast(`Haqiqiy NFC aniqlandi: ${serialNumber}`, 'success');
        tapCurrentNfcCard();
      };
    } catch (error) {
      showToast(`Web NFC xatosi: ${error.message}`, 'error');
    }
  } else {
    showToast('Ushbu brauzerda Web NFC qo\'llab-quvvatlanmaydi. Virtual NFC simulyatori faollashtirildi!', 'info');
    tapCurrentNfcCard();
  }
}

// ==========================================
// 5. 50 SMART LOCKERS ENGINE
// ==========================================
function initLockersData() {
  AppState.lockers = [];
  // 25 male lockers
  for (let i = 1; i <= 25; i++) {
    AppState.lockers.push({
      id: i,
      gender: 'male',
      // realistic occupied pattern (18:00 rush)
      isBusy: [2, 3, 5, 8, 9, 11, 14, 15, 18, 19, 20, 24].includes(i),
      nfcOwner: i === 24 ? 'APEX-NFC-8821' : (i % 2 === 0 ? 'NFC-PASS' : null)
    });
  }
  // 25 female lockers
  for (let i = 26; i <= 50; i++) {
    AppState.lockers.push({
      id: i,
      gender: 'female',
      isBusy: [27, 28, 30, 33, 35, 39, 42].includes(i),
      nfcOwner: i % 2 === 0 ? 'NFC-PASS' : null
    });
  }
}

function filterLockerGender(gender) {
  AppState.activeLockerGender = gender;
  const btnMale = document.getElementById('btnGenderMale');
  const btnFemale = document.getElementById('btnGenderFemale');

  if (gender === 'male') {
    btnMale.className = 'flex-1 py-2 rounded-lg text-xs font-bold transition-all bg-orange-600 text-white shadow';
    btnFemale.className = 'flex-1 py-2 rounded-lg text-xs font-bold transition-all text-slate-300 hover:text-white';
    AppState.selectedLockerId = 1;
  } else {
    btnFemale.className = 'flex-1 py-2 rounded-lg text-xs font-bold transition-all bg-orange-600 text-white shadow';
    btnMale.className = 'flex-1 py-2 rounded-lg text-xs font-bold transition-all text-slate-300 hover:text-white';
    AppState.selectedLockerId = 26;
  }

  renderLockers();
  updateSelectedLockerCard();
}

function renderLockers() {
  const container = document.getElementById('lockersGridContainer');
  if (!container) return;
  container.innerHTML = '';

  const filtered = AppState.lockers.filter(l => l.gender === AppState.activeLockerGender);
  
  let freeCount = 0;
  let busyCount = 0;

  AppState.lockers.forEach(l => {
    if (l.isBusy) busyCount++;
    else freeCount++;
  });

  const countFreeEl = document.getElementById('countFreeLockers');
  const countBusyEl = document.getElementById('countBusyLockers');
  if (countFreeEl) countFreeEl.innerText = freeCount;
  if (countBusyEl) countBusyEl.innerText = busyCount;

  filtered.forEach(locker => {
    const btn = document.createElement('button');
    const isSelected = locker.id === AppState.selectedLockerId;
    const numDisplay = locker.id < 10 ? '0' + locker.id : locker.id;

    btn.className = `locker-btn ${locker.isBusy ? 'locker-busy' : 'locker-free'} ${isSelected ? 'locker-selected' : ''}`;
    btn.onclick = () => {
      AppState.selectedLockerId = locker.id;
      renderLockers();
      updateSelectedLockerCard();
    };

    btn.innerHTML = `
      <i class="fa-solid ${locker.isBusy ? 'fa-lock' : 'fa-lock-open'} text-sm mb-1"></i>
      <span>#${numDisplay}</span>
      <span class="text-[9px] opacity-75">${locker.isBusy ? 'Band' : 'Bo\'sh'}</span>
    `;

    container.appendChild(btn);
  });
}

function updateSelectedLockerCard() {
  const locker = AppState.lockers.find(l => l.id === AppState.selectedLockerId);
  if (!locker) return;

  const numEl = document.getElementById('infoLockerNum');
  const statusEl = document.getElementById('infoLockerStatus');
  const btnAction = document.getElementById('btnActionLocker');

  const numDisplay = locker.id < 10 ? '0' + locker.id : locker.id;
  numEl.innerText = `#${numDisplay} (${locker.gender === 'male' ? 'Erkaklar' : 'Ayollar'})`;

  if (locker.isBusy) {
    statusEl.className = 'ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30';
    statusEl.innerText = 'Band (Qulflangan)';
    btnAction.innerText = 'NFC bilan Qulfni Ochish';
    btnAction.className = 'px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors';
  } else {
    statusEl.className = 'ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    statusEl.innerText = 'Bo\'sh (Ochiq)';
    btnAction.innerText = 'NFC bilan Band Qilish';
    btnAction.className = 'px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors';
  }
}

function toggleSelectedLocker() {
  const locker = AppState.lockers.find(l => l.id === AppState.selectedLockerId);
  if (!locker) return;

  locker.isBusy = !locker.isBusy;
  playHardwareBeep(true);

  showToast(`Shkaf #${locker.id} NFC orqali ${locker.isBusy ? 'muvaffaqiyatli qulflandi' : 'ochildi'}!`, 'success');

  renderLockers();
  updateSelectedLockerCard();
}

function resetLockerSimulation() {
  initLockersData();
  renderLockers();
  updateSelectedLockerCard();
  showToast('Shkaflar tizimi yangilandi va sinxronlandi.', 'info');
}

// ==========================================
// 6. CCTV VIDEO SURVEILLANCE & AI SIMULATION
// ==========================================
function initCctvSimulation() {
  renderCanvasFeed('cctvCanvas1', 'cam1');
  renderCanvasFeed('cctvCanvas2', 'cam2');
  renderCanvasFeed('cctvCanvas3', 'cam3');
  renderCanvasFeed('cctvCanvas4', 'cam4');
}

// Canvas-based real-time video stream generator with AI person detection boxes
function renderCanvasFeed(canvasId, type) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = 400;
  canvas.height = 240;

  let frame = 0;

  function animate() {
    frame++;
    ctx.fillStyle = '#050b14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle background environment shapes
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, 200);
    ctx.lineTo(380, 200);
    ctx.stroke();

    if (type === 'cam1') {
      // Turnstile zone: Draw turnstile post & walking person
      ctx.fillStyle = '#334155';
      ctx.fillRect(180, 120, 40, 80);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(195, 110, 10, 10); // Green LED

      // Person 1
      const pX = 100 + Math.sin(frame * 0.02) * 40;
      drawAiDetectedPerson(ctx, pX, 90, 35, 90, 'PERSON #1 [NFC PASS]', '#10b981');
    } else if (type === 'cam2') {
      // Gym main floor: Multiple people workout simulation
      const p1X = 70 + Math.sin(frame * 0.03) * 15;
      const p2X = 180 + Math.cos(frame * 0.025) * 20;
      const p3X = 290 + Math.sin(frame * 0.015) * 30;

      drawAiDetectedPerson(ctx, p1X, 85, 30, 85, 'PERSON 94%', '#f97316');
      drawAiDetectedPerson(ctx, p2X, 75, 32, 95, 'PERSON 98%', '#f97316');
      drawAiDetectedPerson(ctx, p3X, 90, 28, 80, 'PERSON 91%', '#f97316');

      // Treadmill silhouettes
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(50, 160, 60, 15);
      ctx.fillRect(160, 160, 60, 15);
      ctx.fillRect(270, 160, 60, 15);
    } else if (type === 'cam3') {
      // Lockers aisle
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(40 + i * 55, 60, 45, 120);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(45 + i * 55, 70, 6, 6);
      }
      const pX = 160 + Math.sin(frame * 0.02) * 50;
      drawAiDetectedPerson(ctx, pX, 85, 30, 85, 'LOCKER ACCESS', '#38bdf8');
    } else if (type === 'cam4') {
      // Reception desk
      ctx.fillStyle = '#334155';
      ctx.fillRect(100, 140, 200, 50); // Desk
      drawAiDetectedPerson(ctx, 150, 80, 32, 70, 'STAFF (ADMIN)', '#10b981');
      drawAiDetectedPerson(ctx, 240, 75, 34, 75, 'CLIENT', '#fbbf24');
    }

    requestAnimationFrame(animate);
  }

  animate();
}

function drawAiDetectedPerson(ctx, x, y, w, h, label, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);

  // Corner brackets
  const len = 6;
  ctx.lineWidth = 2.5;
  // Top-left
  ctx.beginPath(); ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
  // Top-right
  ctx.beginPath(); ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len); ctx.stroke();
  // Bottom-left
  ctx.beginPath(); ctx.moveTo(x, y + h - len); ctx.lineTo(x, y + h); ctx.lineTo(x + len, y + h); ctx.stroke();
  // Bottom-right
  ctx.beginPath(); ctx.moveTo(x + w - len, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - len); ctx.stroke();

  // Label tag
  ctx.fillStyle = color;
  ctx.fillRect(x, y - 14, ctx.measureText(label).width + 8, 14);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 9px monospace';
  ctx.fillText(label, x + 4, y - 4);
}

// 18:00 Peak Rush Simulation
function triggerSimulatedRushAlert() {
  const badge = document.getElementById('cam2StatusBadge');
  const count = document.getElementById('cam2PeopleCount');
  
  if (badge) {
    badge.className = 'absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider animate-bounce';
    badge.innerText = 'OGOHLANTIRISH: ZALDA 94% GAVJUMLIK!';
  }
  if (count) count.innerText = '47 kishi';

  showToast('Xavfsizlik ogohlantiruvi: Zalda soat 18:00 pik oqimi aniqlandi! Qo\'shimcha shkaflar zaxirasi ochildi.', 'error');

  setTimeout(() => {
    if (badge) {
      badge.className = 'absolute top-3 right-3 bg-emerald-600/80 text-white text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider';
      badge.innerText = 'OPTIMAL OQIM (68%)';
    }
    if (count) count.innerText = '34 kishi';
  }, 6000);
}

// Real Webcam Access
let webcamStream = null;
async function toggleWebcamFeed() {
  const container = document.getElementById('realWebcamContainer');
  const video = document.getElementById('webcamElement');

  if (webcamStream) {
    closeWebcamFeed();
    return;
  }

  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = webcamStream;
    container.classList.remove('hidden');
    showToast('Haqiqiy qurilma kamerasi ulandi.', 'success');
  } catch (err) {
    showToast(`Kameraga ulanishda xatolik: ${err.message}`, 'error');
  }
}

function closeWebcamFeed() {
  const container = document.getElementById('realWebcamContainer');
  const video = document.getElementById('webcamElement');
  if (webcamStream) {
    webcamStream.getTracks().forEach(track => track.stop());
    webcamStream = null;
  }
  if (video) video.srcObject = null;
  container.classList.add('hidden');
}

// ==========================================
// 7. 3-STEP FEEDBACK LOOP CRM ENGINE
// ==========================================
function renderCrmTickets() {
  const list = document.getElementById('crmTicketsList');
  const filterCat = document.getElementById('crmFilterCategory')?.value || 'all';
  const totalCountEl = document.getElementById('crmTotalCount');
  const pendingBadge = document.getElementById('pendingBadge');

  if (!list) return;
  list.innerHTML = '';

  const filtered = AppState.complaints.filter(item => {
    if (filterCat !== 'all' && item.category !== filterCat) return false;
    return true;
  });

  const pendingCount = AppState.complaints.filter(c => c.status !== 'resolved').length;
  if (totalCountEl) totalCountEl.innerText = `${filtered.length} ta`;
  if (pendingBadge) pendingBadge.innerText = `${pendingCount} ta`;

  filtered.forEach(item => {
    const isSelected = item.id === AppState.selectedTicketId;
    const card = document.createElement('div');
    card.className = `p-4 rounded-2xl border cursor-pointer transition-all ${
      isSelected ? 'bg-slate-800/90 border-orange-500 shadow-lg' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
    }`;
    card.onclick = () => {
      AppState.selectedTicketId = item.id;
      renderCrmTickets();
      renderSelectedTicket();
    };

    let stepBadge = '<span class="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded text-[10px] font-bold">1-qadam (Ochiq javob)</span>';
    if (item.step === 2) stepBadge = '<span class="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded text-[10px] font-bold">2-qadam (Bonus/Chat)</span>';
    if (item.step === 3 || item.status === 'resolved') stepBadge = '<span class="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold">3-qadam (Hal qilindi)</span>';

    card.innerHTML = `
      <div class="flex items-center justify-between mb-1.5">
        <div class="flex items-center gap-2">
          <span class="font-bold text-sm text-white">${item.clientName}</span>
          <span class="text-[10px] font-mono text-slate-500">${item.id}</span>
        </div>
        ${stepBadge}
      </div>
      <p class="text-xs text-slate-300 line-clamp-2 italic mb-2">"${item.message}"</p>
      <div class="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
        <span><i class="fa-solid fa-globe text-orange-400 mr-1"></i>${item.source}</span>
        <span>${item.time}</span>
      </div>
    `;

    list.appendChild(card);
  });
}

function renderSelectedTicket() {
  const ticket = AppState.complaints.find(c => c.id === AppState.selectedTicketId);
  if (!ticket) return;

  document.getElementById('detailTicketId').innerText = `TICKET #${ticket.id}`;
  document.getElementById('detailClientName').innerText = ticket.clientName;
  document.getElementById('detailMessage').innerText = `"${ticket.message}"`;

  const badge = document.getElementById('detailStatusBadge');
  if (ticket.status === 'resolved') {
    badge.className = 'px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    badge.innerText = 'To\'liq Hal Qilindi (5 ★)';
  } else if (ticket.step === 2) {
    badge.className = 'px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
    badge.innerText = '2-Bosqich (Shaxsiy Chat)';
  } else {
    badge.className = 'px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30';
    badge.innerText = '1-Bosqich (Ochiq E\'tirof)';
  }

  // Pre-fill AI smart template for Step 1
  const replyInput = document.getElementById('replyText1');
  if (ticket.category === 'gavjumlik') {
    replyInput.value = `Hurmatli ${ticket.clientName}! Kechki payt yuzaga kelgan noqulaylik va shkaflar bandligi uchun chin dildan uzr so'raymiz. Muammoni bartaraf etish uchun yangi smart locker zaxirasi ishga tushirildi. Vaziyatni to'liq hal qilish uchun siz bilan shaxsiy chatda bog'lanmoqdamiz.`;
  } else if (ticket.category === 'narx') {
    replyInput.value = `Assalomu alaykum, ${ticket.clientName}! Fikringiz biz uchun juda muhim. Narxlarimiz zamonaviy Technogym uskunalari va xalqaro murabbiylar xizmatini qamrab oladi. Sizga maxsus Off-Peak va Cashback sodiqlik tariflarini taklif qilishimiz uchun shaxsiy xat yo'lladik.`;
  } else {
    replyInput.value = `Hurmatli ${ticket.clientName}! Xodimlarning xizmat ko'rsatish madaniyati bo'yicha e'tirozingiz zudlik bilan boshqaruv darajasida ko'rib chiqildi. Xodim bilan tushuntirish ishlari olib borildi. Shaxsiy muloqotda sizga maxsus kompensatsiya taqdim etamiz.`;
  }

  setCrmStep(ticket.step);
}

function setCrmStep(stepNumber) {
  // Update step tabs
  ['stepTab1', 'stepTab2', 'stepTab3'].forEach((id, idx) => {
    const btn = document.getElementById(id);
    if (idx + 1 === stepNumber) {
      btn.className = 'flex-1 py-1.5 rounded-lg font-bold bg-orange-600 text-white';
    } else {
      btn.className = 'flex-1 py-1.5 rounded-lg font-bold text-slate-400 hover:text-white';
    }
  });

  // Toggle containers
  document.getElementById('stepContainer1').classList.toggle('hidden', stepNumber !== 1);
  document.getElementById('stepContainer2').classList.toggle('hidden', stepNumber !== 2);
  document.getElementById('stepContainer3').classList.toggle('hidden', stepNumber !== 3);
}

function sendStep1PublicReply() {
  const ticket = AppState.complaints.find(c => c.id === AppState.selectedTicketId);
  if (!ticket) return;

  const reply = document.getElementById('replyText1').value.trim();
  if (!reply) {
    showToast('Iltimos, ochiq javob matnini kiriting!', 'error');
    return;
  }

  ticket.publicReply = reply;
  ticket.step = 2;
  ticket.status = 'in-progress';

  showToast('1-qadam bajarildi: Ommaviy hurmatli javob yuborildi va mijoz shaxsiy chatga o\'tkazildi!', 'success');
  renderCrmTickets();
  renderSelectedTicket();
}

function sendStep2Compensation() {
  const ticket = AppState.complaints.find(c => c.id === AppState.selectedTicketId);
  if (!ticket) return;

  const compSelect = document.getElementById('compensationSelect');
  const compLabel = compSelect.options[compSelect.selectedIndex].text;

  ticket.compensation = compLabel;
  ticket.step = 3;

  showToast(`2-qadam: Mijozga '${compLabel}' kompensatsiyasi biriktirildi va shaxsiy xat jo'natildi!`, 'success');
  renderCrmTickets();
  renderSelectedTicket();
}

function finalizeStep3Resolved() {
  const ticket = AppState.complaints.find(c => c.id === AppState.selectedTicketId);
  if (!ticket) return;

  ticket.status = 'resolved';
  ticket.source = `${ticket.source} -> Yangilandi: 5 yulduz ★★★★★`;

  showToast(`Ajoyib! ${ticket.clientName} ning e'tirozi to'liq hal qilindi va reputatsiya tiklandi!`, 'success');
  renderCrmTickets();
  renderSelectedTicket();
}

function filterCrmTickets() {
  renderCrmTickets();
}

// 5-Minute Escalation Countdown Timer
function startEscalationTimer() {
  setInterval(() => {
    const ticket = AppState.complaints.find(c => c.id === AppState.selectedTicketId);
    const countdownEl = document.getElementById('escalationCountdown');
    const levelEl = document.getElementById('escalationLevel');

    if (!ticket || ticket.status === 'resolved' || ticket.escalationTimeSec <= 0) {
      if (countdownEl) countdownEl.innerText = '00:00 (Yopilgan)';
      if (levelEl) {
        levelEl.className = 'text-xs font-bold text-emerald-400';
        levelEl.innerText = 'Muammo hal etilgan';
      }
      return;
    }

    ticket.escalationTimeSec--;
    const mins = Math.floor(ticket.escalationTimeSec / 60);
    const secs = ticket.escalationTimeSec % 60;
    const timeFormatted = `${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;

    if (countdownEl) countdownEl.innerText = timeFormatted;

    if (ticket.escalationTimeSec < 60) {
      if (levelEl) {
        levelEl.className = 'text-xs font-bold text-rose-400 animate-pulse';
        levelEl.innerText = 'Bosh Direktor Eskalatsiyasi!';
      }
    }
  }, 1000);
}

// Submit Public Feedback from Client Portal
function submitPublicFeedback(e) {
  e.preventDefault();
  const name = document.getElementById('fbClientName').value.trim();
  const phone = document.getElementById('fbClientPhone').value.trim();
  const category = document.getElementById('fbCategory').value;
  const nfc = document.getElementById('fbNfcCard').value.trim();
  const message = document.getElementById('fbMessage').value.trim();

  const newTicket = {
    id: `APEX-${Math.floor(Math.random() * 900 + 100)}`,
    clientName: name,
    phone: phone,
    category: category,
    source: 'Veb-sayt Mijoz Portali',
    time: 'Hozirgina',
    message: `${message} ${nfc ? '(NFC: ' + nfc + ')' : ''}`,
    step: 1,
    publicReply: '',
    compensation: '',
    status: 'pending',
    escalationTimeSec: 300 // 5 minutes
  };

  AppState.complaints.unshift(newTicket);
  AppState.selectedTicketId = newTicket.id;

  // Reset form
  document.getElementById('publicFeedbackForm').reset();

  showToast('E\'tirozingiz qabul qilindi! Mas\'ul menejer 5 daqiqa ichida siz bilan bog\'lanadi.', 'success');

  renderCrmTickets();
}

function openNewComplaintModal() {
  scrollToFeedbackForm();
}

// ==========================================
// 8. STAFF SOP INTERACTIVE SIMULATOR
// ==========================================
function renderSopScenario() {
  const scenario = AppState.sopScenarios[AppState.currentSimIndex];
  if (!scenario) return;

  document.getElementById('simScenarioStep').innerText = `Keys ${AppState.currentSimIndex + 1} / ${AppState.sopScenarios.length}`;
  document.getElementById('simQuestionText').innerText = scenario.question;

  const container = document.getElementById('simOptionsContainer');
  container.innerHTML = '';

  const feedbackBox = document.getElementById('simFeedbackBox');
  feedbackBox.classList.add('hidden');

  scenario.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-orange-500/60 text-left text-xs sm:text-sm text-slate-200 transition-all flex items-start gap-3';
    btn.innerHTML = `
      <span class="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 text-orange-400">
        ${String.fromCharCode(65 + idx)}
      </span>
      <span>${opt.text}</span>
    `;
    btn.onclick = () => handleSopAnswer(opt);
    container.appendChild(btn);
  });
}

function handleSopAnswer(option) {
  const feedbackBox = document.getElementById('simFeedbackBox');
  feedbackBox.classList.remove('hidden');

  if (option.correct) {
    playHardwareBeep(true);
    feedbackBox.className = 'p-4 rounded-xl text-xs font-medium space-y-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300';
    feedbackBox.innerHTML = `
      <div class="font-bold flex items-center gap-1.5 text-sm text-emerald-400">
        <i class="fa-solid fa-circle-check"></i> To'g'ri kasbiy yondashuv!
      </div>
      <p>${option.feedback}</p>
      <div class="pt-2 flex justify-end">
        <button onclick="nextSopScenario()" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold">
          Keyingi Keysga O'tish <i class="fa-solid fa-arrow-right ml-1"></i>
        </button>
      </div>
    `;
  } else {
    playHardwareBeep(false);
    AppState.sopScore = Math.max(0, AppState.sopScore - 15);
    document.getElementById('sopScoreBadge').innerText = `${AppState.sopScore} / 100`;

    feedbackBox.className = 'p-4 rounded-xl text-xs font-medium space-y-1 bg-rose-500/10 border border-rose-500/30 text-rose-300';
    feedbackBox.innerHTML = `
      <div class="font-bold flex items-center gap-1.5 text-sm text-rose-400">
        <i class="fa-solid fa-circle-xmark"></i> SOP qoidasi buzildi (-15 ball)
      </div>
      <p>${option.feedback}</p>
    `;
  }
}

function nextSopScenario() {
  AppState.currentSimIndex = (AppState.currentSimIndex + 1) % AppState.sopScenarios.length;
  renderSopScenario();
}

// ==========================================
// 9. CHART.JS OCCUPANCY ANALYTICS
// ==========================================
let occupancyChartInstance = null;
function initOccupancyChart() {
  const ctx = document.getElementById('occupancyChart');
  if (!ctx) return;

  const hours = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00 (Pik)', '19:30', '21:00', '23:00'];
  const occupancyData = [15, 38, 42, 35, 30, 48, 94, 88, 55, 20]; // 18:00 is 94% rush

  occupancyChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: hours,
      datasets: [
        {
          label: 'Zal Bandlik Darajasi (%)',
          data: occupancyData,
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.12)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#f97316',
          pointBorderColor: '#fff',
          pointHoverRadius: 6
        },
        {
          label: 'Maksimal Qulay Me\'yor (75%)',
          data: [75, 75, 75, 75, 75, 75, 75, 75, 75, 75],
          borderColor: '#ef4444',
          borderWidth: 1.5,
          borderDash: [6, 6],
          fill: false,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `Bandlik: ${context.parsed.y}% ${context.parsed.y >= 90 ? '(O\'ta yuqori - Off-peak tavsiya etiladi)' : ''}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          ticks: { color: '#94a3b8', font: { size: 11 } }
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          ticks: {
            color: '#94a3b8',
            callback: value => value + '%'
          }
        }
      }
    }
  });
}

function requestMembership(planName) {
  showToast(`'${planName}' tanlandi! Administratorlarimiz keshbek va NFC kartangizni rasmiylashtirish uchun bog'lanadi.`, 'success');
}

// ==========================================
// 10. NOTIFICATION TOAST HELPER
// ==========================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  let bg = 'bg-slate-900 border-slate-700 text-slate-200';
  let icon = 'fa-info-circle text-cyan-400';

  if (type === 'success') {
    bg = 'bg-slate-900 border-emerald-500/50 text-white';
    icon = 'fa-circle-check text-emerald-400';
  } else if (type === 'error') {
    bg = 'bg-slate-900 border-rose-500/50 text-white';
    icon = 'fa-triangle-exclamation text-rose-400';
  }

  toast.className = `toast-msg pointer-events-auto p-4 rounded-2xl border shadow-2xl flex items-start gap-3 text-xs leading-relaxed ${bg}`;
  toast.innerHTML = `
    <i class="fa-solid ${icon} text-base mt-0.5 flex-shrink-0"></i>
    <div class="flex-grow">${message}</div>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4500);
}
