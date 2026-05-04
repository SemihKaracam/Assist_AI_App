/* app.js — Main application controller */

const App = {
  currentPage: null,

  init() {
    Auth.init();

    // Check if already logged in
    if (Auth.currentUser) {
      if (!sessionStorage.getItem('gdpr_accepted')) {
        // Need GDPR re-consent
      } else {
        Auth._showApp();
        return;
      }
    }

    // If GDPR not accepted yet, show it
    if (!sessionStorage.getItem('gdpr_accepted')) {
      document.getElementById('gdpr-modal').classList.add('active');
    } else {
      document.getElementById('gdpr-modal').classList.remove('active');
      document.getElementById('login-page').classList.remove('hidden');
    }

    // Nav click handlers
    document.querySelectorAll('.nav-item').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate(link.dataset.page);
      });
    });

    // Close scenario modal on backdrop click
    document.getElementById('scenario-modal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('scenario-modal')) {
        ScenariosModule.closeModal();
      }
    });
  },

  navigate(page) {
    this.currentPage = page;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });

    const main = document.getElementById('main-content');

    switch(page) {
      case 'dashboard':
        main.innerHTML = this.renderDashboard();
        this._initDashboardCharts();
        break;
      case 'scenarios':
        main.innerHTML = ScenariosModule.renderPage();
        break;
      case 'reports':
        main.innerHTML = ReportsModule.renderPage();
        setTimeout(() => ReportsModule.initCharts(), 50);
        break;
      case 'profile':
        main.innerHTML = this.renderProfile();
        break;
      case 'consent':
        main.innerHTML = ConsentModule.renderPage();
        break;
      case 'admin':
        if (Auth.currentUser && Auth.currentUser.role === 'admin') {
          main.innerHTML = this.renderAdmin();
          setTimeout(() => this._initAdminCharts(), 50);
        } else {
          main.innerHTML = '<div class="card"><p style="color:var(--red)">Erişim Reddedildi</p></div>';
        }
        break;
      default:
        main.innerHTML = this.renderDashboard();
    }

    applyTranslations();
    main.scrollTop = 0;
  },

  /* ── Dashboard ───────────────────────────────── */
  renderDashboard() {
    const user = Auth.currentUser;
    const stats = DB.getUserStats(user.id);
    const sessions = DB.getSessionsByUser(user.id).filter(s => s.completed).slice(-5).reverse();

    const greeting = this._getGreeting();
    const lastSess = sessions[0];
    const trend = this._getTrend(DB.getSessionsByUser(user.id).filter(s=>s.completed));

    return `
      <div class="page-header anim-fade">
        <h1>${greeting}, ${user.firstName || user.email.split('@')[0]}! 👋</h1>
        <p data-i18n="dashboard_subtitle">${t('dashboard_subtitle')}</p>
      </div>

      <!-- Stats -->
      <div class="grid-4" style="margin-bottom:24px">
        <div class="stat-card blue anim-pop" style="animation-delay:0.05s">
          <div class="stat-icon">📋</div>
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label" data-i18n="total_sessions">${t('total_sessions')}</div>
        </div>
        <div class="stat-card green anim-pop" style="animation-delay:0.1s">
          <div class="stat-icon">🎯</div>
          <div class="stat-value">${stats.avgIndependence}%</div>
          <div class="stat-label" data-i18n="avg_independence">${t('avg_independence')}</div>
        </div>
        <div class="stat-card amber anim-pop" style="animation-delay:0.15s">
          <div class="stat-icon">✅</div>
          <div class="stat-value">${stats.completed}</div>
          <div class="stat-label" data-i18n="scenarios_completed">${t('scenarios_completed')}</div>
        </div>
        <div class="stat-card purple anim-pop" style="animation-delay:0.2s">
          <div class="stat-icon">⏱</div>
          <div class="stat-value">${stats.totalMinutes}<span style="font-size:1rem">dk</span></div>
          <div class="stat-label" data-i18n="total_time">${t('total_time')}</div>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom:24px">
        <!-- Quick start -->
        <div class="card anim-fade">
          <div class="card-header">
            <span class="card-title" data-i18n="quick_start">${t('quick_start')}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div onclick="App.navigate('scenarios')" style="cursor:pointer;display:flex;align-items:center;gap:14px;padding:14px;background:linear-gradient(135deg,#EBF2FF,#F0F4FF);border-radius:12px;border:2px solid var(--blue-light);transition:all 0.2s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
              <span style="font-size:2.2rem">🛒</span>
              <div>
                <div style="font-weight:800;font-size:0.95rem" data-i18n="scenario_shopping">${t('scenario_shopping')}</div>
                <div style="font-size:0.78rem;color:var(--text-mid)">${lastSess ? `Son seans: ${Math.round(lastSess.independenceScore)}% bağımsızlık` : 'Henüz denenmedi — başla!'}</div>
              </div>
              <span style="margin-left:auto;color:var(--blue);font-weight:800">→</span>
            </div>

            ${trend.direction !== 'none' ? `
            <div style="padding:12px;background:${trend.direction==='up'?'#F0FDF4':'#FFF7ED'};border-radius:10px;border:1px solid ${trend.direction==='up'?'#BBF7D0':'#FED7AA'};font-size:0.84rem">
              ${trend.direction==='up' ? '📈' : '📉'} Bağımsızlık skoru son 3 seansta <strong>${trend.direction==='up'?'artıyor ✨':'değişiyor'}</strong>
            </div>` : ''}
          </div>
        </div>

        <!-- Recent activity -->
        <div class="card anim-fade">
          <div class="card-header">
            <span class="card-title" data-i18n="recent_activity">${t('recent_activity')}</span>
            ${sessions.length ? `<button class="btn-icon" onclick="App.navigate('reports')">Tümü →</button>` : ''}
          </div>
          ${sessions.length ? `
            <div style="display:flex;flex-direction:column;gap:8px">
              ${sessions.map(s => {
                const date = new Date(s.startedAt).toLocaleDateString(currentLang, {day:'2-digit',month:'short'});
                return `
                  <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
                    <span style="font-size:1.3rem">🛒</span>
                    <div style="flex:1">
                      <div style="font-size:0.85rem;font-weight:700">${t('scenario_'+s.scenarioId)}</div>
                      <div style="font-size:0.75rem;color:var(--text-light)">${date}</div>
                    </div>
                    <div style="text-align:right">
                      <div style="font-weight:800;font-size:0.9rem;color:${s.independenceScore>=70?'var(--green-dark)':'var(--amber-dark)'}">${s.independenceScore}%</div>
                      <div style="font-size:0.7rem;color:var(--text-light)">${s.hintsUsed} ipucu</div>
                    </div>
                  </div>`;
              }).join('')}
            </div>` : `
            <div style="text-align:center;padding:30px 0">
              <div style="font-size:3rem;margin-bottom:12px">🎯</div>
              <p style="color:var(--text-mid);font-size:0.9rem">Henüz tamamlanmış seans yok.</p>
              <button class="btn-primary" style="margin-top:16px" onclick="App.navigate('scenarios')" data-i18n="quick_start">${t('quick_start')}</button>
            </div>`}
        </div>
      </div>

      <!-- Mini progress chart -->
      ${sessions.length >= 2 ? `
      <div class="card anim-fade">
        <div class="card-header">
          <span class="card-title">📈 Son Seanslarda Bağımsızlık Trendi</span>
        </div>
        <canvas id="dash-trend-chart" height="80" style="width:100%"></canvas>
      </div>` : ''}
    `;
  },

  _getGreeting() {
    const h = new Date().getHours();
    const greets = { tr: [h<12?'Günaydın':h<18?'İyi günler':'İyi akşamlar'], en: [h<12?'Good morning':h<18?'Good afternoon':'Good evening'], de: [h<12?'Guten Morgen':h<18?'Guten Tag':'Guten Abend'], fr: [h<12?'Bonjour':h<18?'Bonne journée':'Bonsoir'], es: [h<12?'Buenos días':h<18?'Buenas tardes':'Buenas noches'], pt: [h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'] };
    return (greets[currentLang] || greets.en)[0];
  },

  _getTrend(sessions) {
    if (sessions.length < 3) return { direction: 'none' };
    const recent = sessions.slice(-3).map(s => s.independenceScore);
    const up = recent[2] > recent[0];
    return { direction: up ? 'up' : 'down' };
  },

  _initDashboardCharts() {
    const canvas = document.getElementById('dash-trend-chart');
    if (!canvas) return;
    const sessions = DB.getSessionsByUser(Auth.currentUser.id).filter(s=>s.completed).slice(-8);
    if (sessions.length < 2) return;

    const W = canvas.offsetWidth || 700, H = 80;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const scores = sessions.map(s => s.independenceScore);
    const padL=30, padR=20, padT=10, padB=20;
    const chartW = W-padL-padR, chartH = H-padT-padB;
    const xStep = chartW/(scores.length-1);

    const grad = ctx.createLinearGradient(0,padT,0,H-padB);
    grad.addColorStop(0,'rgba(34,197,94,0.3)'); grad.addColorStop(1,'rgba(34,197,94,0)');

    ctx.beginPath();
    scores.forEach((v,i) => { const x=padL+i*xStep; const y=padT+chartH-((v/100)*chartH); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    ctx.lineTo(padL+(scores.length-1)*xStep,H-padB); ctx.lineTo(padL,H-padB); ctx.closePath();
    ctx.fillStyle=grad; ctx.fill();

    ctx.beginPath(); ctx.strokeStyle='#22C55E'; ctx.lineWidth=2.5; ctx.lineJoin='round';
    scores.forEach((v,i) => { const x=padL+i*xStep; const y=padT+chartH-((v/100)*chartH); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    ctx.stroke();

    scores.forEach((v,i) => {
      const x=padL+i*xStep; const y=padT+chartH-((v/100)*chartH);
      ctx.beginPath(); ctx.fillStyle='#22C55E'; ctx.arc(x,y,4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#4B5A7A'; ctx.font='9px Nunito'; ctx.textAlign='center';
      ctx.fillText(v+'%', x, y-7);
    });
  },

  /* ── Profile ─────────────────────────────────── */
  renderProfile() {
    const user = Auth.currentUser;
    return `
      <div class="page-header anim-fade">
        <h1 data-i18n="profile_title">${t('profile_title')}</h1>
      </div>
      <div class="grid-2 anim-fade">
        <div class="card">
          <div class="card-header"><span class="card-title">👤 Kişisel Bilgiler</span></div>
          <div class="form-group"><label data-i18n="first_name">${t('first_name')}</label><input type="text" id="pf-fname" value="${user.firstName||''}" /></div>
          <div class="form-group"><label data-i18n="last_name">${t('last_name')}</label><input type="text" id="pf-lname" value="${user.lastName||''}" /></div>
          <div class="form-group"><label data-i18n="email_label">${t('email_label')}</label><input type="email" id="pf-email" value="${user.email||''}" /></div>
          <div class="form-group"><label data-i18n="birth_date">${t('birth_date')}</label><input type="date" id="pf-bdate" value="${user.birthDate||''}" /></div>
          <div class="form-group"><label data-i18n="country_label">${t('country_label')}</label>
            <select id="pf-country">
              ${['TR','DE','FR','ES','PT','GB','US','OTHER'].map(c => `<option value="${c}" ${user.country===c?'selected':''}>${c}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">👨‍👩‍👧 Ebeveyn Bilgileri</span></div>
          <div class="form-group"><label data-i18n="parent_name_label">${t('parent_name_label')}</label><input type="text" id="pf-pname" value="${user.parentName||''}" /></div>
          <div class="form-group"><label data-i18n="parent_email_label">${t('parent_email_label')}</label><input type="email" id="pf-pemail" value="${user.parentEmail||''}" /></div>
          <div class="form-group"><label data-i18n="diagnosis_label">${t('diagnosis_label')}</label><textarea id="pf-diag" rows="3">${user.diagnosis||''}</textarea></div>
          <div style="background:var(--surface2);border-radius:8px;padding:12px;font-size:0.8rem;color:var(--text-mid)">
            <strong>KVKK / GDPR</strong><br>
            Onay tarihi: ${user.gdprConsentDate ? new Date(user.gdprConsentDate).toLocaleDateString() : '—'}
          </div>
          <button class="btn-primary" style="margin-top:16px" onclick="App.saveProfile()" data-i18n="save_profile">${t('save_profile')}</button>
        </div>
      </div>`;
  },

  saveProfile() {
    const user = Auth.currentUser;
    const updates = {
      firstName: document.getElementById('pf-fname').value,
      lastName: document.getElementById('pf-lname').value,
      email: document.getElementById('pf-email').value,
      birthDate: document.getElementById('pf-bdate').value,
      country: document.getElementById('pf-country').value,
      parentName: document.getElementById('pf-pname').value,
      parentEmail: document.getElementById('pf-pemail').value,
      diagnosis: document.getElementById('pf-diag').value,
    };
    const updated = DB.updateUser(user.id, updates);
    Auth.currentUser = updated;
    sessionStorage.setItem('assist_current_user', JSON.stringify(updated));
    Auth._toast('Profil güncellendi!', 'success');
  },

  /* ── Admin ────────────────────────────────────── */
  renderAdmin() {
    const users = DB.getUsers();
    const allSessions = DB.getSessions().filter(s=>s.completed);
    const countryStats = DB.getCountryStats();

    return `
      <div class="page-header anim-fade">
        <h1 data-i18n="admin_title">${t('admin_title')}</h1>
      </div>

      <!-- Global stats -->
      <div class="grid-4" style="margin-bottom:24px">
        <div class="stat-card blue anim-pop"><div class="stat-icon">👥</div><div class="stat-value">${users.length}</div><div class="stat-label">Toplam Kullanıcı</div></div>
        <div class="stat-card green anim-pop"><div class="stat-icon">📋</div><div class="stat-value">${allSessions.length}</div><div class="stat-label">Toplam Seans</div></div>
        <div class="stat-card amber anim-pop"><div class="stat-icon">🎯</div><div class="stat-value">${allSessions.length ? Math.round(allSessions.reduce((a,s)=>a+s.independenceScore,0)/allSessions.length) : 0}%</div><div class="stat-label">Global Ort. Bağımsızlık</div></div>
        <div class="stat-card purple anim-pop"><div class="stat-icon">🌍</div><div class="stat-value">${countryStats.length}</div><div class="stat-label">Ülke Sayısı</div></div>
      </div>

      <!-- Country breakdown -->
      <div class="card" style="margin-bottom:24px">
        <div class="card-header">
          <span class="card-title">🌍 ${t('country_report')}</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Ülke</th><th>Kullanıcı</th><th>Seans</th><th>Ort. Bağımsızlık</th></tr></thead>
            <tbody>
              ${countryStats.length ? countryStats.map(c => `
                <tr>
                  <td><strong>${c.country}</strong></td>
                  <td>${c.uniqueUsers}</td>
                  <td>${c.sessions}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div class="progress-bar" style="width:80px"><div class="progress-fill ${c.avgIndependence>=70?'green':''}" style="width:${c.avgIndependence}%"></div></div>
                      <strong>${c.avgIndependence}%</strong>
                    </div>
                  </td>
                </tr>`).join('') : '<tr><td colspan="4" style="color:var(--text-light);text-align:center;padding:20px">Veri yok</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Country chart -->
      <div class="grid-2" style="margin-bottom:24px">
        <div class="card">
          <div class="card-header"><span class="card-title">📊 Ülke Bazlı Bağımsızlık</span></div>
          <canvas id="admin-country-chart" height="160"></canvas>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">👥 Tüm Kullanıcılar</span></div>
          <div class="table-wrap" style="max-height:200px;overflow-y:auto">
            <table>
              <thead><tr><th>Ad</th><th>Ülke</th><th>Rol</th><th>Seans</th></tr></thead>
              <tbody>
                ${users.map(u => {
                  const uSess = DB.getSessionsByUser(u.id).filter(s=>s.completed).length;
                  return `<tr>
                    <td>${u.firstName} ${u.lastName||''}</td>
                    <td>${u.country||'—'}</td>
                    <td><span class="badge badge-blue">${u.role||'user'}</span></td>
                    <td>${uSess}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- All sessions table -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📋 Tüm Seanslar</span>
          <button class="btn-primary" onclick="App.exportGlobalReport()">📥 Global Rapor</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Tarih</th><th>Kullanıcı</th><th>Ülke</th><th>Senaryo</th><th>Bağımsızlık</th><th>İpucu</th><th>Süre</th></tr></thead>
            <tbody>
              ${allSessions.slice().reverse().slice(0,20).map(s => {
                const u = DB.getUserById(s.userId);
                const date = new Date(s.startedAt).toLocaleDateString();
                const dur = Math.round(s.totalDuration/60);
                return `<tr>
                  <td>${date}</td>
                  <td>${u ? u.firstName+' '+u.lastName : s.userId}</td>
                  <td>${s.country||'—'}</td>
                  <td>${t('scenario_'+s.scenarioId)}</td>
                  <td><span style="font-weight:800;color:${s.independenceScore>=70?'var(--green-dark)':'var(--amber-dark)'}">${s.independenceScore}%</span></td>
                  <td>${s.hintsUsed}</td>
                  <td>${dur} dk</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  _initAdminCharts() {
    const canvas = document.getElementById('admin-country-chart');
    if (!canvas) return;
    const countryStats = DB.getCountryStats();
    if (!countryStats.length) return;

    const W = canvas.offsetWidth || 400, H = 160;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const padL=40, padR=20, padT=10, padB=30;
    const chartW = W-padL-padR, chartH = H-padT-padB;
    const barW = Math.min(chartW/countryStats.length - 10, 50);
    const colors = ['#4F8EF7','#22C55E','#F59E0B','#8B5CF6','#14B8A6'];
    const maxVal = Math.max(...countryStats.map(c=>c.avgIndependence),1);

    countryStats.forEach((c, i) => {
      const x = padL + (i/(countryStats.length))*(chartW) + (chartW/countryStats.length - barW)/2;
      const barH = (c.avgIndependence/maxVal)*chartH;
      const y = padT + chartH - barH;
      ctx.fillStyle = colors[i%colors.length];
      ctx.beginPath(); ctx.roundRect(x,y,barW,barH,4); ctx.fill();
      ctx.fillStyle='#4B5A7A'; ctx.font='bold 11px Nunito'; ctx.textAlign='center';
      ctx.fillText(c.avgIndependence+'%', x+barW/2, y-5);
      ctx.fillStyle='#8A97B8'; ctx.font='10px Nunito';
      ctx.fillText(c.country, x+barW/2, H-8);
    });

    [0,50,100].forEach(v => {
      const y = padT + chartH - (v/maxVal)*chartH;
      ctx.strokeStyle='#DDE3F0'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(W-padR,y); ctx.stroke();
      ctx.fillStyle='#8A97B8'; ctx.font='9px Nunito'; ctx.textAlign='left';
      ctx.fillText(v+'%', 2, y+4);
    });
  },

  exportGlobalReport() {
    const allSessions = DB.getSessions().filter(s=>s.completed);
    const countryStats = DB.getCountryStats();

    const rows = allSessions.slice().reverse().map(s => {
      const u = DB.getUserById(s.userId);
      return `<tr><td>${new Date(s.startedAt).toLocaleDateString()}</td><td>${u?u.firstName+' '+u.lastName:s.userId}</td><td>${s.country||'—'}</td><td>${s.scenarioId}</td><td>${s.independenceScore}%</td><td>${s.hintsUsed}</td><td>${Math.round(s.totalDuration/60)} dk</td></tr>`;
    }).join('');

    const cRows = countryStats.map(c => `<tr><td><strong>${c.country}</strong></td><td>${c.uniqueUsers}</td><td>${c.sessions}</td><td>${c.avgIndependence}%</td></tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ASSIST-AI Global Rapor</title>
    <style>body{font-family:Arial,sans-serif;padding:32px;max-width:900px;margin:0 auto}h1{color:#2563EB;border-bottom:3px solid #2563EB;padding-bottom:10px}h2{color:#4B5A7A;margin:24px 0 10px}table{width:100%;border-collapse:collapse;margin-bottom:24px}th{background:#EBF2FF;padding:9px;font-size:0.8rem;text-align:left;border-bottom:2px solid #DDE3F0}td{padding:8px;border-bottom:1px solid #DDE3F0;font-size:0.82rem}.footer{font-size:0.7rem;color:#8A97B8;margin-top:24px;border-top:1px solid #DDE3F0;padding-top:12px}</style>
    </head><body>
    <h1>ASSIST-AI — Global Platform Raporu</h1>
    <p>Oluşturma tarihi: ${new Date().toLocaleString()}</p>
    <h2>🌍 Ülke Bazlı Özet</h2>
    <table><thead><tr><th>Ülke</th><th>Kullanıcı</th><th>Seans</th><th>Ort. Bağımsızlık</th></tr></thead><tbody>${cRows}</tbody></table>
    <h2>📋 Tüm Seanslar</h2>
    <table><thead><tr><th>Tarih</th><th>Kullanıcı</th><th>Ülke</th><th>Senaryo</th><th>Bağımsızlık</th><th>İpucu</th><th>Süre</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="footer">ASSIST-AI Platform | ${new Date().toISOString()}</div>
    </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
