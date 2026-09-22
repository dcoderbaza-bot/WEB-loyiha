/**
 * APEX FITNESS — SECURE BACKEND SERVER
 * Architecture:
 * - Pure Node.js (Zero-dependency, Built-in HTTP, Crypto, FS, Path)
 * - Static Web Server (serves index.html, styles.css, app.js)
 * - RESTful API with Role-Based Access Control (RBAC)
 * - Brute-Force Rate Limiter & Security Audit Logger
 * - Token-based Authentication (Bearer Token)
 * - Port: 3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

// In-Memory Database with Security Salts & Credentials
const USERS_DB = [
  {
    id: 'u-admin',
    username: 'admin',
    passwordHash: hashPassword('Admin@2026!'),
    name: 'Sardor Rahimov',
    role: 'admin',
    roleLabel: 'Bosh Administrator',
    allowedPanels: ['client-portal', 'nfc-lockers', 'cctv-surveillance', 'reputation-crm', 'staff-sop', 'pricing-value', 'audit-security'],
    nfcCard: 'APEX-NFC-ADMIN-01',
    balance: 0,
    cashback: 0
  },
  {
    id: 'u-manager',
    username: 'manager',
    passwordHash: hashPassword('Manager@2026!'),
    name: 'Zilola Saidova',
    role: 'manager',
    roleLabel: 'Mijozlar Bilan Ishlash Menejeri',
    allowedPanels: ['client-portal', 'reputation-crm', 'staff-sop', 'pricing-value'],
    nfcCard: 'APEX-NFC-MGR-02',
    balance: 0,
    cashback: 0
  },
  {
    id: 'u-security',
    username: 'security',
    passwordHash: hashPassword('Security@2026!'),
    name: 'Bobur Mirzayev',
    role: 'security',
    roleLabel: 'Xavfsizlik Xizmati Nazoratchisi',
    allowedPanels: ['client-portal', 'nfc-lockers', 'cctv-surveillance'],
    nfcCard: 'APEX-NFC-SEC-03',
    balance: 0,
    cashback: 0
  },
  {
    id: 'u-client1',
    username: 'mijoz',
    passwordHash: hashPassword('Mijoz@2026!'),
    name: 'Sardor Aliyev',
    role: 'user',
    roleLabel: 'VIP Platinum Mijoz',
    allowedPanels: ['client-portal', 'nfc-lockers', 'pricing-value'],
    nfcCard: 'APEX-NFC-8821-UZ',
    lockerId: 24,
    membership: 'VIP Platinum',
    balance: 800000,
    cashback: 180000
  },
  {
    id: 'u-client2',
    username: 'user2',
    passwordHash: hashPassword('Mijoz@2026!'),
    name: 'Malika Umarova',
    role: 'user',
    roleLabel: 'Standart Fit Mijoz',
    allowedPanels: ['client-portal', 'nfc-lockers', 'pricing-value'],
    nfcCard: 'APEX-NFC-4109-UZ',
    lockerId: 7,
    membership: 'Morning & Day Fit',
    balance: 490000,
    cashback: 45000
  }
];

// Active Auth Sessions: token -> { userId, expiresAt, ip }
const SESSIONS = new Map();

// Brute-force Login Attempt Tracker: ip -> { count, lockedUntil }
const FAILED_LOGINS = new Map();

// Security Audit Log Storage
const AUDIT_LOGS = [
  {
    timestamp: new Date().toISOString(),
    ip: '127.0.0.1',
    action: 'SYSTEM_BOOT',
    username: 'SYSTEM',
    details: 'Apex Fitness Secure Backend ishga tushirildi. RBAC va Audit qatlamlari faollashtirildi.',
    severity: 'INFO'
  }
];

function logAudit(action, username, details, severity = 'INFO', ip = '127.0.0.1') {
  const entry = {
    timestamp: new Date().toISOString(),
    ip,
    action,
    username: username || 'ANONYMOUS',
    details,
    severity
  };
  AUDIT_LOGS.unshift(entry);
  if (AUDIT_LOGS.length > 200) AUDIT_LOGS.pop();
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_APEX_SALT_2026').digest('hex');
}

// Generate Secure Session Token
function generateSessionToken(user, ip) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  SESSIONS.set(token, {
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt,
    ip
  });
  return token;
}

// Helper: Parse Request Body (JSON)
function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        resolve({});
      }
    });
    req.on('end', () => {
      if (!body || !body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        console.warn('JSON parsing error for body:', body);
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

// Authentication & RBAC Middleware Helper
function authenticateRequest(req) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7).trim();
  const session = SESSIONS.get(token);

  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    SESSIONS.delete(token);
    return null;
  }

  const user = USERS_DB.find(u => u.id === session.userId);
  return user || null;
}

// MIME Types for Static File Serving
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// ==========================================
// HTTP SERVER & ROUTER
// ==========================================
const server = http.createServer(async (req, res) => {
  const clientIp = req.socket.remoteAddress || '127.0.0.1';
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const method = req.method;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ==========================================
  // REST API ROUTES
  // ==========================================
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');

    try {
      // 1. POST /api/auth/login
      if (pathname === '/api/auth/login' && method === 'POST') {
        // Brute-force check
        const ipAttempts = FAILED_LOGINS.get(clientIp) || { count: 0, lockedUntil: 0 };
        if (Date.now() < ipAttempts.lockedUntil) {
          const waitMinutes = Math.ceil((ipAttempts.lockedUntil - Date.now()) / 60000);
          logAudit('LOGIN_BLOCKED', '', `Bloklangan IP dan kirishga urinish: ${clientIp}`, 'WARNING', clientIp);
          res.writeHead(429);
          res.end(JSON.stringify({
            success: false,
            message: `Xavfsizlik tizimi: Ko'p marta xato terildi. Iltimos ${waitMinutes} daqiqadan so'ng qayta urinib ko'ring!`
          }));
          return;
        }

        const body = await parseJsonBody(req);
        const { username, password } = body;

        const user = USERS_DB.find(u => u.username === username);
        const inputHash = hashPassword(password || '');

        if (!user || user.passwordHash !== inputHash) {
          ipAttempts.count++;
          if (ipAttempts.count >= 5) {
            ipAttempts.lockedUntil = Date.now() + 5 * 60 * 1000; // 5 min lock
            logAudit('BRUTE_FORCE_LOCK', username, `5 marta noto'g'ri urinish. IP 5 daqiqaga bloklandi.`, 'CRITICAL', clientIp);
          } else {
            FAILED_LOGINS.set(clientIp, ipAttempts);
            logAudit('LOGIN_FAILED', username, `Noto'g'ri login/parol kiritildi (Urinish: ${ipAttempts.count}/5)`, 'WARNING', clientIp);
          }

          res.writeHead(401);
          res.end(JSON.stringify({
            success: false,
            message: `Login yoki parol noto'g'ri! (Qolgan urinishlar: ${Math.max(0, 5 - ipAttempts.count)})`
          }));
          return;
        }

        // Successful login
        FAILED_LOGINS.delete(clientIp);
        const token = generateSessionToken(user, clientIp);
        logAudit('LOGIN_SUCCESS', user.username, `Tizimga muvaffaqiyatli kirdi (${user.roleLabel})`, 'INFO', clientIp);

        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            roleLabel: user.roleLabel,
            allowedPanels: user.allowedPanels,
            nfcCard: user.nfcCard,
            lockerId: user.lockerId,
            membership: user.membership,
            balance: user.balance,
            cashback: user.cashback
          }
        }));
        return;
      }

      // 2. POST /api/auth/register (Yangi Mijoz Ro'yxatdan O'tishi)
      if (pathname === '/api/auth/register' && method === 'POST') {
        const body = await parseJsonBody(req);
        const { username, password, name, phone } = body;

        if (!username || !password || !name) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, message: 'Barcha maydonlarni to\'ldiring!' }));
          return;
        }

        if (USERS_DB.some(u => u.username === username.toLowerCase())) {
          res.writeHead(409);
          res.end(JSON.stringify({ success: false, message: 'Bu login allaqachon band qilingan!' }));
          return;
        }

        const newNfcNum = Math.floor(Math.random() * 9000 + 1000);
        const newUser = {
          id: 'u-' + Date.now(),
          username: username.toLowerCase().trim(),
          passwordHash: hashPassword(password),
          name: name.trim(),
          phone: phone || '',
          role: 'user',
          roleLabel: 'Yangi A\'zo (Smart NFC)',
          allowedPanels: ['client-portal', 'nfc-lockers', 'pricing-value'],
          nfcCard: `APEX-NFC-${newNfcNum}-UZ`,
          lockerId: null,
          membership: 'Standart Fit',
          balance: 0,
          cashback: 50000 // Welcome bonus
        };

        USERS_DB.push(newUser);
        const token = generateSessionToken(newUser, clientIp);
        logAudit('USER_REGISTERED', newUser.username, `Yangi mijoz ro'yxatdan o'tdi. NFC: ${newUser.nfcCard}`, 'INFO', clientIp);

        res.writeHead(201);
        res.end(JSON.stringify({
          success: true,
          message: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz! Sizga 50,000 so\'m xush kelibsiz bonusi va Virtual NFC berildi.',
          token,
          user: {
            id: newUser.id,
            username: newUser.username,
            name: newUser.name,
            role: newUser.role,
            roleLabel: newUser.roleLabel,
            allowedPanels: newUser.allowedPanels,
            nfcCard: newUser.nfcCard,
            lockerId: newUser.lockerId,
            membership: newUser.membership,
            balance: newUser.balance,
            cashback: newUser.cashback
          }
        }));
        return;
      }

      // 3. GET /api/auth/me
      if (pathname === '/api/auth/me' && method === 'GET') {
        const user = authenticateRequest(req);
        if (!user) {
          res.writeHead(401);
          res.end(JSON.stringify({ success: false, message: 'Sessiya topilmadi yoki muddati tugagan' }));
          return;
        }

        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            roleLabel: user.roleLabel,
            allowedPanels: user.allowedPanels,
            nfcCard: user.nfcCard,
            lockerId: user.lockerId,
            membership: user.membership,
            balance: user.balance,
            cashback: user.cashback
          }
        }));
        return;
      }

      // 4. POST /api/auth/logout
      if (pathname === '/api/auth/logout' && method === 'POST') {
        const authHeader = req.headers['authorization'] || '';
        if (authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7).trim();
          const session = SESSIONS.get(token);
          if (session) {
            logAudit('LOGOUT', session.username, 'Tizimdan chiqdi', 'INFO', clientIp);
            SESSIONS.delete(token);
          }
        }
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, message: 'Chiqildi' }));
        return;
      }

      // 5. GET /api/audit/logs (SECURITY AUDIT - Admin Only!)
      if (pathname === '/api/audit/logs' && method === 'GET') {
        const user = authenticateRequest(req);
        if (!user || user.role !== 'admin') {
          logAudit('ACCESS_DENIED', user ? user.username : 'GUEST', `Audit jurnaliga ruxsatsiz murojaat!`, 'WARNING', clientIp);
          res.writeHead(403);
          res.end(JSON.stringify({
            success: false,
            message: '403 Forbidden: Xavfsizlik audit jurnalini ko\'rish faqat Bosh Administrator uchun ruxsat etilgan!'
          }));
          return;
        }

        res.writeHead(200);
        res.end(JSON.stringify({ success: true, logs: AUDIT_LOGS }));
        return;
      }

      // 6. GET /api/cctv/status (Admin & Security Only!)
      if (pathname === '/api/cctv/status' && method === 'GET') {
        const user = authenticateRequest(req);
        if (!user || !['admin', 'security'].includes(user.role)) {
          logAudit('SECURITY_VIOLATION', user ? user.username : 'GUEST', `CCTV Kamera nazoratiga ruxsatsiz kirishga urinish!`, 'CRITICAL', clientIp);
          res.writeHead(403);
          res.end(JSON.stringify({
            success: false,
            message: '403 Ruxsat Berilmadi: Kamera nazorati faqat Xavfsizlik Xizmati va Bosh Administrator uchun himoyalangan!'
          }));
          return;
        }

        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          cameras: [
            { id: 1, name: 'CAM 01: Turniket & Kirish', status: 'ONLINE', fps: 30, resolution: '1080P' },
            { id: 2, name: 'CAM 02: Katta Trenajyor Zali', status: 'ONLINE', fps: 30, peopleCount: 34, aiCrowdLevel: '68%' },
            { id: 3, name: 'CAM 03: Shkaflar Yo\'lagi', status: 'ONLINE', fps: 30, motionSensor: 'ACTIVE' },
            { id: 4, name: 'CAM 04: Kassa & Muloqot', status: 'ONLINE', fps: 30, audioSopStatus: 'COMPLIANT' }
          ]
        }));
        return;
      }

      // 7. GET /api/crm/tickets (Admin & Manager Only!)
      if (pathname === '/api/crm/tickets' && method === 'GET') {
        const user = authenticateRequest(req);
        if (!user || !['admin', 'manager'].includes(user.role)) {
          res.writeHead(403);
          res.end(JSON.stringify({
            success: false,
            message: '403 Ruxsat Berilmadi: CRM Shikoyatlar markazi faqat Menejment uchun ruxsat etilgan!'
          }));
          return;
        }

        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
        return;
      }

      // Route not found
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, message: 'Endpoint not found' }));
      return;

    } catch (apiError) {
      console.error('API Error:', apiError);
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, message: 'Ichki server xatoligi: ' + apiError.message }));
      return;
    }
  }

  // ==========================================
  // STATIC FILE SERVING
  // ==========================================
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security: Prevent Directory Traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Server Error loading file');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`[APEX FITNESS SERVER] Ishga tushdi!`);
  console.log(`Manzil: http://localhost:${PORT}`);
  console.log(`RBAC va Xavfsizlik Audit qatlamlari to'liq faol.`);
  console.log(`====================================================`);
});
