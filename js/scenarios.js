/* scenarios.js — Scenario pages and shopping simulation */

const SCENARIOS_DATA = [
  {
    id: 'shopping',
    emoji: '🛒',
    thumbClass: 'shopping',
    goals: [
      { title: 'Ürün Bulma', desc: 'Supermarkette doğru reyonu bul' },
      { title: 'Bağımsızlık', desc: 'İpucu olmadan adımları tamamla' },
      { title: 'Problem Çözme', desc: 'Ürün olmadığında alternatif üret' },
      { title: 'Sosyal Beceri', desc: 'Görevliye doğru şekilde sor' }
    ],
    difficulties: { easy: 300, medium: 180, hard: 120 },  // seconds
    items: ['milk', 'bread', 'banana']
  },
  {
    id: 'bus',
    emoji: '🚌',
    thumbClass: 'bus',
    goals: [
      { title: 'Rota Planlama', desc: 'Doğru otobüs numarasını bul' },
      { title: 'Bilet Alma', desc: 'Ödeme işlemini tamamla' },
      { title: 'Durak Takibi', desc: 'Doğru durakta in' },
      { title: 'Zaman Yönetimi', desc: 'Güzergahı zamanında tamamla' }
    ],
    difficulties: { easy: 360, medium: 240, hard: 150 },
    items: []
  },
  {
    id: 'cafe',
    emoji: '☕',
    thumbClass: 'cafe',
    goals: [
      { title: 'Menü Okuma', desc: 'Menüdeki seçenekleri incele' },
      { title: 'Sipariş Verme', desc: 'Görevliye sipariş ver' },
      { title: 'Ödeme', desc: 'Hesabı hesapla ve öde' },
      { title: 'Sosyal İletişim', desc: 'Kibarca iletişim kur' }
    ],
    difficulties: { easy: 300, medium: 200, hard: 120 },
    items: []
  }
];

const SHELF_DATA = [
  { id: 'dairy',     emoji: '🥛', correctFor: ['milk'] },
  { id: 'beverages', emoji: '🥤', correctFor: [] },
  { id: 'produce',   emoji: '🥦', correctFor: ['banana'] },
  { id: 'bakery',    emoji: '🍞', correctFor: ['bread'] }
];

const ScenariosModule = {
  /* ── Scenarios list page ─────────────────────── */
  renderPage() {
    return `
      <div class="page-header anim-fade">
        <h1 data-i18n="scenarios_title">${t('scenarios_title')}</h1>
        <p data-i18n="scenarios_subtitle">${t('scenarios_subtitle')}</p>
      </div>
      <div class="scenarios-grid anim-fade">
        ${SCENARIOS_DATA.map(sc => this._renderCard(sc)).join('')}
        ${this._renderLockedCard('directions','🗺️','Yol Tarifi Sorma')}
        ${this._renderLockedCard('restaurant','🍽️','Restoran Deneyimi')}
        ${this._renderLockedCard('bank','🏦','Bankada İşlem')}
      </div>`;
  },

  _renderCard(sc) {
    const isAvail = sc.id === 'shopping';
    return `
      <div class="scenario-card" onclick="ScenariosModule.openScenario('${sc.id}')">
        <div class="scenario-thumb ${sc.thumbClass}">
          <span style="font-size:4.5rem">${sc.emoji}</span>
          ${!isAvail ? `<span class="scenario-thumb-lock">🔒 ${t('coming_soon')}</span>` : ''}
        </div>
        <div class="scenario-body">
          <div class="scenario-title" data-i18n="scenario_${sc.id}">${t('scenario_' + sc.id)}</div>
          <div class="scenario-desc" data-i18n="scenario_${sc.id}_desc">${t('scenario_' + sc.id + '_desc')}</div>
          <div class="scenario-meta">
            <span class="badge badge-blue">⏱ ${Object.values(sc.difficulties)[1]/60} dk</span>
            <span class="badge badge-green">🎯 ${sc.items.length || '—'} görev</span>
          </div>
        </div>
        <div class="scenario-goals">
          <div class="scenario-goals-title" data-i18n="scenario_goals">${t('scenario_goals')}</div>
          ${sc.goals.slice(0,3).map(g => `
            <div class="goal-item"><div class="goal-dot"></div><span>${t(g.title) || g.title}</span></div>
          `).join('')}
        </div>
      </div>`;
  },

  _renderLockedCard(id, emoji, name) {
    return `
      <div class="scenario-card" style="opacity:0.6;cursor:default">
        <div class="scenario-thumb ${id}">
          <span style="font-size:4.5rem">${emoji}</span>
          <span class="scenario-thumb-lock">🔒 ${t('coming_soon')}</span>
        </div>
        <div class="scenario-body">
          <div class="scenario-title">${name}</div>
          <div class="scenario-desc" style="color:var(--text-light)">${t('coming_soon')}</div>
        </div>
      </div>`;
  },

  /* ── Open scenario intro modal ─────────────────── */
  openScenario(scenarioId) {
    if (scenarioId !== 'shopping') { Auth._toast('Bu senaryo henüz hazır değil!', 'info'); return; }
    const sc = SCENARIOS_DATA.find(s => s.id === scenarioId);
    if (!sc) return;

    const modal = document.getElementById('scenario-modal');
    const inner = document.getElementById('scenario-modal-inner');

    inner.innerHTML = `
      <div class="scenario-intro">
        <div class="scenario-intro-hero">
          <div class="big-emoji">${sc.emoji}</div>
          <h2 data-i18n="scenario_${sc.id}">${t('scenario_' + sc.id)}</h2>
          <p style="color:var(--text-mid)">${t('scenario_' + sc.id + '_desc')}</p>
        </div>

        <div style="margin-bottom:18px">
          <div class="scenario-goals-title" style="margin-bottom:12px">${t('scenario_goals')}</div>
          <div class="goals-grid">
            ${sc.goals.map(g => `
              <div class="goal-card">
                <div class="goal-card-icon">🎯</div>
                <div>
                  <div class="goal-card-title">${g.title}</div>
                  <div class="goal-card-text">${g.desc}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>

        <div style="margin-bottom:20px">
          <div class="scenario-goals-title" style="margin-bottom:12px">${t('select_difficulty')}</div>
          <div class="difficulty-select">
            <button class="diff-btn selected easy" data-diff="easy" onclick="ScenariosModule._selectDiff(this,'easy')">
              <span class="diff-emoji">😊</span>
              <div class="diff-label">${t('difficulty_easy')}</div>
              <div style="font-size:0.72rem;color:var(--text-light)">${sc.difficulties.easy/60} dk</div>
            </button>
            <button class="diff-btn medium" data-diff="medium" onclick="ScenariosModule._selectDiff(this,'medium')">
              <span class="diff-emoji">🤔</span>
              <div class="diff-label">${t('difficulty_medium')}</div>
              <div style="font-size:0.72rem;color:var(--text-light)">${sc.difficulties.medium/60} dk</div>
            </button>
            <button class="diff-btn hard" data-diff="hard" onclick="ScenariosModule._selectDiff(this,'hard')">
              <span class="diff-emoji">😤</span>
              <div class="diff-label">${t('difficulty_hard')}</div>
              <div style="font-size:0.72rem;color:var(--text-light)">${sc.difficulties.hard/60} dk</div>
            </button>
          </div>
        </div>

        <div style="display:flex;gap:12px;justify-content:flex-end">
          <button class="btn-secondary" onclick="ScenariosModule.closeModal()">${t('gdpr_reject') || 'İptal'}</button>
          <button class="btn-primary" onclick="ScenariosModule.startSimulation('${scenarioId}','easy')" id="start-sim-btn">${t('start_scenario')}</button>
        </div>
      </div>`;

    modal.classList.add('active');
  },

  _selectDiff(btn, diff) {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('start-sim-btn').onclick = () => ScenariosModule.startSimulation('shopping', diff);
  },

  closeModal() {
    const modal = document.getElementById('scenario-modal');
    modal.classList.remove('active');
    // Stop timer if running
    if (this._timerInterval) { clearInterval(this._timerInterval); this._timerInterval = null; }
  },

  /* ══ SHOPPING SIMULATION ════════════════════════ */
  _session: null,
  _timerInterval: null,
  _currentItemIdx: 0,
  _timeLeft: 0,
  _totalTime: 0,
  _focusStart: null,
  _focusTotal: 0,
  _showException: false,

  startSimulation(scenarioId, difficulty) {
    const sc = SCENARIOS_DATA.find(s => s.id === scenarioId);
    const timeLimit = sc.difficulties[difficulty];

    // Create session
    this._session = DB.createSession(Auth.currentUser.id, scenarioId, difficulty);
    this._session.items = sc.items.map(id => ({ id, completed: false, support: 'independent', hintLevel: 0 }));
    this._timeLeft = timeLimit;
    this._totalTime = timeLimit;
    this._currentItemIdx = 0;
    this._focusStart = Date.now();
    this._focusTotal = 0;
    this._showException = false;

    DB.logEvent(this._session.id, 'task_started', { scenario: scenarioId, difficulty, timeLimit });

    this._renderSimulation();
    this._startTimer();
  },

  _renderSimulation() {
    const sc = SCENARIOS_DATA.find(s => s.id === 'shopping');
    const inner = document.getElementById('scenario-modal-inner');
    const item = this._session.items[this._currentItemIdx];
    const hintLevel = item ? item.hintLevel : 0;

    inner.innerHTML = `
      <div class="sim-container">
        <!-- Header -->
        <div class="sim-header">
          <div style="display:flex;align-items:center;gap:10px;flex:1">
            <span style="font-size:1.4rem">🛒</span>
            <h2>${t('scenario_shopping')}</h2>
          </div>
          <div class="sim-metrics">
            <div class="sim-metric">
              <span class="sim-metric-label">⏱</span>
              <span class="sim-metric-value" id="sim-timer">${this._formatTime(this._timeLeft)}</span>
            </div>
            <div class="sim-metric">
              <span class="sim-metric-label">${t('independence_score')}</span>
              <span class="sim-metric-value" id="sim-ind-score">${this._calcCurrentIndependence()}%</span>
            </div>
            <div class="sim-metric">
              <span class="sim-metric-label">${t('hints_used')}</span>
              <span class="sim-metric-value" id="sim-hints">${this._session.hintsUsed}</span>
            </div>
          </div>
          <button class="close-btn" onclick="ScenariosModule.closeModal()">✕</button>
        </div>

        <div class="sim-body">
          <!-- Main area -->
          <div class="sim-main">
            <!-- Step progress -->
            <div class="step-progress">
              ${this._session.items.map((it, i) => `
                <div class="step-dot ${it.completed ? 'done' : i === this._currentItemIdx ? 'active' : ''}"></div>
                ${i < this._session.items.length-1 ? '<div class="step-line"></div>' : ''}
              `).join('')}
            </div>

            <!-- Avatar bubble -->
            <div class="avatar-bubble" id="avatar-bubble">
              <div class="avatar-figure">🤖</div>
              <div class="avatar-speech" id="avatar-speech">
                ${this._getAvatarMessage()}
              </div>
            </div>

            <!-- Store scene -->
            ${this._showException ? this._renderException() : this._renderStore()}
          </div>

          <!-- Sidebar: task list -->
          <div class="sim-sidebar">
            <div class="card-title" style="margin-bottom:14px">${t('sim_task_label')}</div>
            <div class="task-list">
              ${this._session.items.map((it, i) => `
                <div class="task-item ${it.completed ? 'completed' : i === this._currentItemIdx ? 'active' : ''}">
                  <div class="task-check">${it.completed ? '✓' : i === this._currentItemIdx ? '▶' : ''}</div>
                  <span>${i+1}. ${t(it.id)}</span>
                </div>`).join('')}
            </div>

            <div style="margin-top:20px">
              <div class="card-title" style="margin-bottom:10px">📊 Anlık Metrik</div>
              <div style="margin-bottom:10px">
                <div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-bottom:4px">
                  <span style="color:var(--text-mid)">${t('independence_score')}</span>
                  <span style="font-weight:800" id="sidebar-ind">${this._calcCurrentIndependence()}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill ${this._calcCurrentIndependence()>70?'green':''}" style="width:${this._calcCurrentIndependence()}%" id="sidebar-ind-bar"></div>
                </div>
              </div>
              <div style="font-size:0.78rem;color:var(--text-mid)">
                ⏱ Odak süresi: <strong id="sidebar-focus">0s</strong>
              </div>
            </div>

            <!-- Hint buttons (only if current item pending) -->
            ${item && !item.completed && !this._showException ? `
              <div style="margin-top:20px">
                <div class="card-title" style="margin-bottom:10px">💡 ${t('sim_step_hint')}</div>
                <div class="hint-buttons">
                  <button class="hint-btn level-0" onclick="ScenariosModule.requestHint(0)">${t('sim_hint_general')}</button>
                  <button class="hint-btn level-1" onclick="ScenariosModule.requestHint(1)">${t('sim_hint_specific')}</button>
                  <button class="hint-btn level-2" onclick="ScenariosModule.requestHint(2)">${t('sim_hint_direct')}</button>
                </div>
              </div>` : ''}
          </div>
        </div>
      </div>`;
  },

  _renderStore() {
    const item = this._session.items[this._currentItemIdx];
    if (!item || item.completed) return '<div style="text-align:center;padding:20px;font-size:3rem">✅</div>';

    return `
      <div class="store-scene">
        <div style="font-weight:800;font-size:0.9rem;color:#1E40AF;margin-bottom:12px">
          🏪 ${t('scenario_shopping_desc')} — <strong>${t(item.id)}</strong> arıyorsun
        </div>
        <div class="store-shelves">
          ${SHELF_DATA.map(shelf => `
            <div class="shelf-section" onclick="ScenariosModule.selectShelf('${shelf.id}','${item.id}')">
              <span class="shelf-emoji">${shelf.emoji}</span>
              <div class="shelf-label">${t(shelf.id)}</div>
            </div>`).join('')}
        </div>
        <div style="margin-top:16px;display:flex;gap:10px;justify-content:center">
          <button class="btn-primary green" onclick="ScenariosModule.foundItem()">${t('sim_step_found')}</button>
          <button class="btn-secondary" onclick="ScenariosModule.cannotFind()">${t('sim_step_notfound')}</button>
        </div>
      </div>`;
  },

  _renderException() {
    return `
      <div class="emotion-panel">
        <h3>😟 ${t('sim_step_notfound')}</h3>
        <p style="font-size:0.85rem;color:#7C2D12;margin-bottom:12px">${t('sim_exception_msg')}</p>
        <div class="breathing-circles">
          <div class="breath-circle" id="bc1" onclick="ScenariosModule.breathe(1)">1</div>
          <div class="breath-circle" id="bc2" onclick="ScenariosModule.breathe(2)">2</div>
          <div class="breath-circle" id="bc3" onclick="ScenariosModule.breathe(3)">3</div>
        </div>
        <p style="font-size:0.8rem;color:#9A3412;margin:12px 0 0">Sonraki adım ne olsun?</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
          <button class="btn-icon" onclick="ScenariosModule.exceptionChoice('alt')">${t('sim_exception_alt')}</button>
          <button class="btn-icon" onclick="ScenariosModule.exceptionChoice('staff')">${t('sim_exception_staff')}</button>
          <button class="btn-icon" onclick="ScenariosModule.foundItem()">${t('sim_step_found')}</button>
          <button class="btn-icon" onclick="ScenariosModule.exceptionChoice('skip')">${t('sim_exception_skip')}</button>
        </div>
      </div>`;
  },

  _getAvatarMessage() {
    const item = this._session.items[this._currentItemIdx];
    if (this._currentItemIdx === 0 && !item.completed && item.hintLevel === 0) return t('sim_intro_msg');
    if (item && item.hintLevel === 1) return t(item.id + '_location') || '🔍 Bölüm adını düşün...';
    if (item && item.hintLevel === 2) return t(item.id + '_direct') || '📍 Tam konumu söylüyorum: ...';
    if (this._showException) return t('sim_exception_msg');
    const done = this._session.items.filter(i => i.completed).length;
    if (done > 0 && item) return `Harika! ${done} tane buldun. Şimdi "${t(item.id)}" sırası!`;
    return t('sim_intro_msg');
  },

  selectShelf(shelfId, itemId) {
    const shelf = SHELF_DATA.find(s => s.id === shelfId);
    const correct = shelf && shelf.correctFor.includes(itemId);
    // Visual feedback
    document.querySelectorAll('.shelf-section').forEach(el => el.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    if (correct) {
      setTimeout(() => this.foundItem(), 400);
    } else {
      Auth._toast('🤔 Bu reyon değil, tekrar dene!', 'info');
      DB.logEvent(this._session.id, 'wrong_shelf', { shelf: shelfId, item: itemId });
    }
  },

  requestHint(level) {
    const item = this._session.items[this._currentItemIdx];
    if (!item) return;
    const weights = [1, 0.75, 0.50, 0.25];
    const prevWeight = weights[Math.min(item.hintLevel, 3)];
    item.hintLevel = Math.max(item.hintLevel, level + 1);
    item.support = ['independent','general','specific','direct'][item.hintLevel] || 'direct';
    this._session.hintsUsed++;
    this._session.hintLevels.push(level);
    DB.logEvent(this._session.id, 'hint_requested', { item: item.id, hint_level: level });
    DB.saveSession(this._session);
    this._renderSimulation();
    this._updateHeader();
  },

  foundItem() {
    const item = this._session.items[this._currentItemIdx];
    if (!item) return;
    item.completed = true;
    this._showException = false;
    DB.logEvent(this._session.id, 'item_completed', { item: item.id, support: item.support });
    DB.saveSession(this._session);

    // Move to next
    if (this._currentItemIdx < this._session.items.length - 1) {
      this._currentItemIdx++;
      this._renderSimulation();
    } else {
      // All done!
      this._finishSimulation(true);
    }
  },

  cannotFind() {
    this._showException = true;
    DB.logEvent(this._session.id, 'emotion_regulation_started', { trigger: 'item_not_found' });
    this._renderSimulation();
  },

  breathe(num) {
    document.getElementById('bc' + num).classList.add('active');
    if (num === 3) {
      setTimeout(() => {
        this._showException = false;
        this._renderSimulation();
      }, 1200);
    }
  },

  exceptionChoice(choice) {
    DB.logEvent(this._session.id, 'exception_choice', { choice });
    if (choice === 'skip') {
      const item = this._session.items[this._currentItemIdx];
      item.completed = true; item.support = 'skipped';
      this._showException = false;
      this.foundItem();
    } else if (choice === 'staff') {
      this._showStaffDialog();
    } else {
      this._showException = false;
      this._renderSimulation();
    }
  },

  _showStaffDialog() {
    const steps = t('sim_staff_steps');
    const inner = document.querySelector('.sim-main');
    inner.innerHTML = `
      <div class="avatar-bubble">
        <div class="avatar-figure">🤖</div>
        <div class="avatar-speech">Görevliye sormak için şu adımları takip et:</div>
      </div>
      <div class="store-scene" style="background:linear-gradient(135deg,#EDE9FE,#DDD6FE)">
        <div style="font-weight:800;margin-bottom:14px">👥 Görevliye Sorma Adımları</div>
        <div class="task-list" style="margin-bottom:16px">
          ${steps.map((s,i) => `
            <div class="task-item ${i===0?'active':''}" id="staff-step-${i}">
              <div class="task-check">${i===0?'▶':''}</div>
              <span>${s}</span>
            </div>`).join('')}
        </div>
        <div style="display:flex;gap:8px;justify-content:center">
          <button class="btn-primary" onclick="ScenariosModule._advanceStaffStep(0,${steps.length})">✅ Bu adımı yaptım</button>
        </div>
      </div>`;
    this._staffStepCurrent = 0;
  },

  _staffStepCurrent: 0,
  _advanceStaffStep(current, total) {
    const steps = t('sim_staff_steps');
    const prevEl = document.getElementById('staff-step-' + current);
    if (prevEl) { prevEl.classList.remove('active'); prevEl.classList.add('completed'); prevEl.querySelector('.task-check').textContent = '✓'; }
    const next = current + 1;
    if (next < total) {
      const nextEl = document.getElementById('staff-step-' + next);
      if (nextEl) { nextEl.classList.add('active'); nextEl.querySelector('.task-check').textContent = '▶'; }
      document.querySelector('.btn-primary[onclick*="_advanceStaffStep"]').setAttribute('onclick', `ScenariosModule._advanceStaffStep(${next},${total})`);
    } else {
      DB.logEvent(this._session.id, 'staff_interaction_completed', {});
      this.foundItem();
    }
  },

  _startTimer() {
    this._timerInterval = setInterval(() => {
      this._timeLeft--;
      const timerEl = document.getElementById('sim-timer');
      if (timerEl) {
        timerEl.textContent = this._formatTime(this._timeLeft);
        if (this._timeLeft <= 30) timerEl.classList.add('timer-warning');
      }
      // Update focus
      const focusEl = document.getElementById('sidebar-focus');
      if (focusEl) focusEl.textContent = Math.round((Date.now() - this._focusStart) / 1000) + 's';

      if (this._timeLeft <= 0) {
        clearInterval(this._timerInterval);
        this._finishSimulation(false);
      }
    }, 1000);
  },

  _formatTime(s) {
    const m = Math.floor(s/60), sec = s%60;
    return `${m}:${sec.toString().padStart(2,'0')}`;
  },

  _calcCurrentIndependence() {
    const items = this._session ? this._session.items : [];
    if (!items.length) return 100;
    const weights = { independent: 1, general: 0.75, specific: 0.50, direct: 0.25, skipped: 0 };
    const done = items.filter(i => i.completed);
    if (!done.length) return 100;
    const sum = done.reduce((a, it) => a + (weights[it.support] !== undefined ? weights[it.support] : 1), 0);
    return Math.round((sum / items.length) * 100);
  },

  _updateHeader() {
    const indEl = document.getElementById('sim-ind-score');
    const hintEl = document.getElementById('sim-hints');
    if (indEl) indEl.textContent = this._calcCurrentIndependence() + '%';
    if (hintEl) hintEl.textContent = this._session.hintsUsed;
    const sideInd = document.getElementById('sidebar-ind');
    const sideBar = document.getElementById('sidebar-ind-bar');
    const v = this._calcCurrentIndependence();
    if (sideInd) sideInd.textContent = v + '%';
    if (sideBar) sideBar.style.width = v + '%';
  },

  _finishSimulation(success) {
    clearInterval(this._timerInterval);
    const elapsed = this._totalTime - this._timeLeft;
    const ind = this._calcCurrentIndependence();
    this._session.completed = true;
    this._session.finishedAt = new Date().toISOString();
    this._session.independenceScore = success ? ind : Math.max(ind - 15, 0);
    this._session.totalDuration = elapsed;
    this._session.focusDuration = Math.round((Date.now() - this._focusStart) / 1000);
    this._session.timePenalty = !success;
    DB.saveSession(this._session);
    DB.logEvent(this._session.id, 'task_finished', {
      completed_items: this._session.items.filter(i=>i.completed).length,
      independence_score: this._session.independenceScore
    });
    this._renderSummary(success);
  },

  _renderSummary(success) {
    const sess = this._session;
    const inner = document.getElementById('scenario-modal-inner');
    const scoreColor = sess.independenceScore >= 70 ? '#22C55E' : sess.independenceScore >= 40 ? '#F59E0B' : '#EF4444';
    const completedCount = sess.items.filter(i => i.completed).length;

    inner.innerHTML = `
      <div class="summary-screen">
        <div style="font-size:3rem">${success ? '🎉' : '⏰'}</div>
        <h2 style="font-family:var(--font-display);font-size:1.5rem;margin:12px 0 4px">${t(success ? 'sim_score_title' : 'task_failed')}</h2>
        <div class="summary-score-display" style="color:${scoreColor}">${sess.independenceScore}%</div>
        <p style="color:var(--text-mid);font-size:0.9rem">${t('sim_score_independence')}</p>

        <div class="summary-metrics">
          <div class="summary-metric">
            <div class="val">${completedCount}/${sess.items.length}</div>
            <div class="lbl">Tamamlanan</div>
          </div>
          <div class="summary-metric">
            <div class="val">${this._formatTime(sess.totalDuration)}</div>
            <div class="lbl">${t('sim_score_time')}</div>
          </div>
          <div class="summary-metric">
            <div class="val">${sess.hintsUsed}</div>
            <div class="lbl">${t('sim_score_hints')}</div>
          </div>
          <div class="summary-metric">
            <div class="val">${this._formatTime(sess.focusDuration)}</div>
            <div class="lbl">${t('sim_score_focus')}</div>
          </div>
        </div>

        <!-- Item breakdown -->
        <div class="task-list" style="margin:16px 0;text-align:left">
          ${sess.items.map(it => {
            const labels = { independent:'Bağımsız ✨', general:'Genel ipucu', specific:'Açık ipucu', direct:'Direkt yardım', skipped:'Atlandı' };
            return `<div class="task-item ${it.completed?'completed':''}">
              <div class="task-check">${it.completed?'✓':'✗'}</div>
              <span>${t(it.id)}</span>
              <span style="margin-left:auto;font-size:0.75rem;color:var(--text-light)">${labels[it.support]||it.support}</span>
            </div>`;
          }).join('')}
        </div>

        <!-- Self evaluation -->
        <div style="text-align:left;margin-bottom:20px">
          <div class="card-title" style="margin-bottom:12px">💭 Öz Değerlendirme</div>
          <div class="form-group">
            <label>${t('sim_self_eval_q1')}</label>
            <input type="text" id="eval-hard" placeholder="${t('sim_self_eval_placeholder')}" />
          </div>
          <div class="form-group">
            <label>${t('sim_self_eval_q2')}</label>
            <input type="text" id="eval-best" placeholder="${t('sim_self_eval_placeholder')}" />
          </div>
        </div>

        <div style="display:flex;gap:12px;justify-content:center">
          <button class="btn-secondary" onclick="ScenariosModule.startSimulation('shopping','${sess.difficulty}')">${t('sim_replay')}</button>
          <button class="btn-primary" onclick="ScenariosModule.saveAndClose()">${t('sim_save_result')}</button>
        </div>
      </div>`;
  },

  saveAndClose() {
    const hard = document.getElementById('eval-hard');
    const best = document.getElementById('eval-best');
    if (this._session) {
      this._session.selfEval = {
        hard: hard ? hard.value : '',
        best: best ? best.value : ''
      };
      DB.saveSession(this._session);
    }
    Auth._toast('Sonuç kaydedildi! 🎉', 'success');
    this.closeModal();
    // Refresh dashboard stats
    if (typeof App !== 'undefined') App.navigate('dashboard');
  }
};
