/* auth.js — Authentication & GDPR flow */

const Auth = {
  currentUser: null,

  init() {
    // Restore session
    const saved = sessionStorage.getItem('assist_current_user');
    if (saved) {
      try { this.currentUser = JSON.parse(saved); } catch {}
    }
    this._bindGDPR();
    this._bindLogin();
  },

  _bindGDPR() {
    const check1 = document.getElementById('gdpr-check1');
    const check2 = document.getElementById('gdpr-check2');
    const acceptBtn = document.getElementById('gdpr-accept');
    const rejectBtn = document.getElementById('gdpr-reject');

    const update = () => {
      if (acceptBtn) acceptBtn.disabled = !(check1.checked && check2.checked);
    };
    if (check1) check1.addEventListener('change', update);
    if (check2) check2.addEventListener('change', update);

    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        sessionStorage.setItem('gdpr_accepted', '1');
        this._closeModal('gdpr-modal');
        if (this.currentUser) {
          this._showApp();
        } else {
          document.getElementById('login-page').classList.remove('hidden');
        }
      });
    }

    if (rejectBtn) {
      rejectBtn.addEventListener('click', () => {
        document.getElementById('gdpr-modal').innerHTML = `
          <div class="modal-box" style="text-align:center;padding:48px">
            <div style="font-size:3rem;margin-bottom:16px">🔒</div>
            <h2 style="font-family:var(--font-display);margin-bottom:12px">${t('gdpr_reject')}</h2>
            <p style="color:var(--text-mid);margin-bottom:24px">Bu uygulama KVKK onayı olmadan kullanılamaz.</p>
            <button class="btn-primary" onclick="location.reload()">Geri Dön</button>
          </div>`;
      });
    }
  },

  _closeModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.remove('active'); setTimeout(() => m.classList.add('hidden'), 300); }
  },

  _bindLogin() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        const form = document.getElementById(tab + '-form');
        if (form) form.classList.add('active');
      });
    });

    document.getElementById('do-login').addEventListener('click', () => this._doLogin());
    document.getElementById('do-register').addEventListener('click', () => this._doRegister());
    document.getElementById('logout-btn').addEventListener('click', () => this._doLogout());
  },

  _doLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const role = document.getElementById('login-role').value;
    if (!email) { this._toast('E-posta gerekli', 'error'); return; }

    // Find user in DB or create demo user
    let users = DB.getUsers();
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      // Auto-create for demo
      user = DB.createUser({ email, password, firstName: email.split('@')[0], lastName: '', role, country: 'TR' });
    }
    this.currentUser = user;
    sessionStorage.setItem('assist_current_user', JSON.stringify(user));
    this._showApp();
  },

  _doRegister() {
    const fn = document.getElementById('reg-firstname').value.trim();
    const ln = document.getElementById('reg-lastname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const country = document.getElementById('reg-country').value;
    const bd = document.getElementById('reg-birthdate').value;
    const pn = document.getElementById('reg-parent-name').value.trim();
    const pe = document.getElementById('reg-parent-email').value.trim();
    const diag = document.getElementById('reg-diagnosis').value.trim();

    if (!fn || !email || !password) { this._toast('Ad ve e-posta gerekli', 'error'); return; }

    const user = DB.createUser({
      email, password, firstName: fn, lastName: ln, country,
      birthDate: bd, parentName: pn, parentEmail: pe, diagnosis: diag,
      role: 'user'
    });
    this.currentUser = user;
    sessionStorage.setItem('assist_current_user', JSON.stringify(user));
    this._toast('Kayıt başarılı! Hoş geldiniz.', 'success');
    this._showApp();
  },

  _doLogout() {
    this.currentUser = null;
    sessionStorage.removeItem('assist_current_user');
    sessionStorage.removeItem('gdpr_accepted');
    document.getElementById('app').classList.add('hidden');
    document.getElementById('login-page').classList.add('hidden');
    // Re-show GDPR
    const gdpr = document.getElementById('gdpr-modal');
    gdpr.classList.remove('hidden');
    gdpr.classList.add('active');
    const check1 = document.getElementById('gdpr-check1');
    const check2 = document.getElementById('gdpr-check2');
    if (check1) check1.checked = false;
    if (check2) check2.checked = false;
    document.getElementById('gdpr-accept').disabled = true;
  },

  _showApp() {
    document.getElementById('login-page').classList.add('hidden');
    const app = document.getElementById('app');
    app.classList.remove('hidden');
    // Show admin nav if admin
    if (this.currentUser && this.currentUser.role === 'admin') {
      document.getElementById('admin-nav-item').classList.remove('hidden');
    }
    // Init lang switcher
    const sw = document.getElementById('lang-switcher');
    if (sw) { sw.value = currentLang; }
    App.navigate('dashboard');
  },

  _toast(msg, type = 'info') {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;bottom:24px;right:24px;z-index:9999;
      padding:12px 20px;border-radius:10px;font-weight:700;font-size:0.9rem;
      box-shadow:0 4px 20px rgba(0,0,0,0.15);animation:slideUp 0.3s ease;
      background:${type==='error'?'#EF4444':type==='success'?'#22C55E':'#4F8EF7'};color:white;
    `;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
};
