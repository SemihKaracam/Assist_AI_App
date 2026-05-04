/* db.js — In-browser data persistence (localStorage-based) */

const DB = {
  PREFIX: 'assist_ai_',

  _key(name) { return this.PREFIX + name; },

  get(name) {
    try { return JSON.parse(localStorage.getItem(this._key(name))); }
    catch { return null; }
  },

  set(name, value) {
    try { localStorage.setItem(this._key(name), JSON.stringify(value)); return true; }
    catch { return false; }
  },

  push(name, item) {
    const arr = this.get(name) || [];
    arr.push(item);
    return this.set(name, arr);
  },

  /* ── Users ─────────────────────────────────── */
  getUsers()          { return this.get('users') || []; },
  saveUsers(users)    { return this.set('users', users); },

  getUserById(id) {
    return this.getUsers().find(u => u.id === id) || null;
  },

  createUser(data) {
    const users = this.getUsers();
    const user = {
      id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
      createdAt: new Date().toISOString(),
      gdprConsent: true,
      gdprConsentDate: new Date().toISOString(),
      ...data
    };
    users.push(user);
    this.saveUsers(users);
    return user;
  },

  updateUser(id, updates) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates };
    this.saveUsers(users);
    return users[idx];
  },

  /* ── Sessions ────────────────────────────────── */
  getSessions()               { return this.get('sessions') || []; },
  getSessionsByUser(uid)      { return this.getSessions().filter(s => s.userId === uid); },
  getSessionsByCountry(code)  { return this.getSessions().filter(s => s.country === code); },

  saveSession(sessionData) {
    const sessions = this.getSessions();
    const existing = sessions.findIndex(s => s.id === sessionData.id);
    if (existing >= 0) { sessions[existing] = sessionData; }
    else { sessions.push(sessionData); }
    this.set('sessions', sessions);
    return sessionData;
  },

  createSession(userId, scenarioId, difficulty) {
    const user = this.getUserById(userId);
    const session = {
      id: 'sess_' + Date.now(),
      userId,
      country: user ? user.country : 'UNKNOWN',
      scenarioId,
      difficulty,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      completed: false,
      independenceScore: 0,
      hintsUsed: 0,
      hintLevels: [],
      focusDuration: 0,
      totalDuration: 0,
      items: [],
      emotionRegulations: [],
      selfEval: { hard: '', best: '' },
      timePenalty: false,
      events: []
    };
    this.saveSession(session);
    return session;
  },

  logEvent(sessionId, eventName, payload = {}) {
    const sessions = this.getSessions();
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return;
    sessions[idx].events = sessions[idx].events || [];
    sessions[idx].events.push({
      event: eventName,
      timestamp: new Date().toISOString(),
      ...payload
    });
    this.set('sessions', sessions);
  },

  /* ── Stats ─────────────────────────────────── */
  getUserStats(userId) {
    const sessions = this.getSessionsByUser(userId).filter(s => s.completed);
    if (!sessions.length) return { total: 0, avgIndependence: 0, totalMinutes: 0, completed: 0 };
    const avgInd = sessions.reduce((a,s) => a + (s.independenceScore||0), 0) / sessions.length;
    const totalMin = Math.round(sessions.reduce((a,s) => a + (s.totalDuration||0), 0) / 60);
    return {
      total: sessions.length,
      avgIndependence: Math.round(avgInd),
      totalMinutes: totalMin,
      completed: sessions.length
    };
  },

  getCountryStats() {
    const sessions = this.getSessions().filter(s => s.completed);
    const map = {};
    sessions.forEach(s => {
      if (!map[s.country]) map[s.country] = { sessions: 0, avgInd: 0, users: new Set() };
      map[s.country].sessions++;
      map[s.country].avgInd += (s.independenceScore||0);
      map[s.country].users.add(s.userId);
    });
    return Object.entries(map).map(([code, d]) => ({
      country: code,
      sessions: d.sessions,
      avgIndependence: Math.round(d.avgInd / d.sessions),
      uniqueUsers: d.users.size
    }));
  },

  /* ── Consent records ─────────────────────────── */
  getConsents()             { return this.get('consents') || []; },
  saveConsent(consentData)  { this.push('consents', consentData); return consentData; },
  getConsentByUser(uid)     { return this.getConsents().filter(c => c.userId === uid); },

  /* ── Seed demo data ──────────────────────────── */
  seedDemo() {
    if (this.get('seeded')) return;
    // Demo users
    const u1 = this.createUser({ email:'demo@example.com', password:'demo', firstName:'Ali', lastName:'Yılmaz', role:'user', country:'TR', parentName:'Mehmet Yılmaz', parentEmail:'mehmet@example.com', birthDate:'2004-03-15' });
    const u2 = this.createUser({ email:'parent@example.com', password:'demo', firstName:'Mehmet', lastName:'Yılmaz', role:'parent', country:'TR', parentName:'', parentEmail:'' });
    const u3 = this.createUser({ email:'admin@example.com', password:'demo', firstName:'Admin', lastName:'User', role:'admin', country:'TR' });
    const u4 = this.createUser({ email:'thomas@example.com', password:'demo', firstName:'Thomas', lastName:'Müller', role:'user', country:'DE', parentName:'Klaus Müller', parentEmail:'klaus@example.com', birthDate:'2003-07-22' });

    // Demo sessions
    const scenarios = ['shopping','shopping','shopping','bus'];
    const dates = [30,22,14,7,2];
    dates.forEach((daysAgo, i) => {
      const d = new Date(); d.setDate(d.getDate() - daysAgo);
      const sc = scenarios[i % scenarios.length];
      const sess = this.createSession(u1.id, sc, 'medium');
      sess.completed = true;
      sess.finishedAt = d.toISOString();
      sess.startedAt = new Date(d.getTime() - 380000).toISOString();
      sess.independenceScore = 55 + Math.floor(i * 8);
      sess.hintsUsed = 4 - i;
      sess.totalDuration = 320 + i * 40;
      sess.focusDuration = 280 + i * 35;
      sess.items = [{name:'milk',completed:true,support:'general'},{name:'bread',completed:true,support:'independent'},{name:'banana',completed:i>1,support:'direct'}];
      this.saveSession(sess);
    });

    // Thomas demo
    const ts = this.createSession(u4.id, 'shopping', 'easy');
    ts.completed = true; ts.independenceScore = 72; ts.hintsUsed = 2;
    ts.totalDuration = 280; ts.focusDuration = 250;
    ts.items = [{name:'milk',completed:true,support:'general'},{name:'bread',completed:true,support:'independent'},{name:'banana',completed:true,support:'general'}];
    this.saveSession(ts);

    this.set('seeded', true);
  }
};

// Seed on first load
document.addEventListener('DOMContentLoaded', () => DB.seedDemo());
