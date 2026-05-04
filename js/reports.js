/* reports.js — Reporting module */

const ReportsModule = {
  renderPage() {
    const user = Auth.currentUser;
    const sessions = DB.getSessionsByUser(user.id).filter(s => s.completed);
    const stats = DB.getUserStats(user.id);

    return `
      <div class="page-header anim-fade">
        <h1 data-i18n="reports_title">${t('reports_title')}</h1>
        <p data-i18n="reports_subtitle">${t('reports_subtitle')}</p>
      </div>

      <!-- Stat summary row -->
      <div class="grid-4" style="margin-bottom:24px">
        <div class="stat-card blue anim-pop">
          <div class="stat-icon">📋</div>
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">${t('total_sessions')}</div>
        </div>
        <div class="stat-card green anim-pop">
          <div class="stat-icon">🎯</div>
          <div class="stat-value">${stats.avgIndependence}%</div>
          <div class="stat-label">${t('avg_independence')}</div>
        </div>
        <div class="stat-card amber anim-pop">
          <div class="stat-icon">✅</div>
          <div class="stat-value">${stats.completed}</div>
          <div class="stat-label">${t('scenarios_completed')}</div>
        </div>
        <div class="stat-card purple anim-pop">
          <div class="stat-icon">⏱</div>
          <div class="stat-value">${stats.totalMinutes}dk</div>
          <div class="stat-label">${t('total_time')}</div>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom:24px">
        <!-- Independence trend chart -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">${t('independence_trend')}</span>
            <span class="badge badge-blue">${sessions.length} seans</span>
          </div>
          <canvas id="trend-chart" height="160"></canvas>
          ${sessions.length === 0 ? '<p style="color:var(--text-light);text-align:center;padding:20px">Henüz tamamlanmış seans yok</p>' : ''}
        </div>

        <!-- Scenario breakdown -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">${t('scenario_breakdown')}</span>
          </div>
          <canvas id="breakdown-chart" height="160"></canvas>
          ${sessions.length === 0 ? '<p style="color:var(--text-light);text-align:center;padding:20px">Henüz veri yok</p>' : ''}
        </div>
      </div>

      <!-- Hint usage chart -->
      <div class="card" style="margin-bottom:24px">
        <div class="card-header">
          <span class="card-title">💡 İpucu Kullanım Analizi</span>
        </div>
        <canvas id="hint-chart" height="100"></canvas>
        ${sessions.length === 0 ? '<p style="color:var(--text-light);text-align:center;padding:20px">Henüz veri yok</p>' : ''}
      </div>

      <!-- Session history table -->
      <div class="card" style="margin-bottom:24px">
        <div class="card-header">
          <span class="card-title">${t('session_history')}</span>
          <button class="btn-primary" onclick="ReportsModule.exportPDF()">${t('export_pdf')}</button>
        </div>
        <div class="table-wrap">
          ${this._renderSessionTable(sessions)}
        </div>
      </div>
    `;
  },

  _renderSessionTable(sessions) {
    if (!sessions.length) return '<p style="padding:20px;color:var(--text-light)">Henüz tamamlanmış seans yok.</p>';
    return `
      <table>
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Senaryo</th>
            <th>Zorluk</th>
            <th>${t('independence_score')}</th>
            <th>${t('hints_used')}</th>
            <th>Süre</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          ${sessions.slice().reverse().map(s => {
            const date = new Date(s.startedAt).toLocaleDateString(currentLang, {day:'2-digit',month:'short',year:'numeric'});
            const dur = Math.round(s.totalDuration/60);
            const diffLabels = { easy: t('difficulty_easy'), medium: t('difficulty_medium'), hard: t('difficulty_hard') };
            return `
              <tr>
                <td>${date}</td>
                <td>${t('scenario_' + s.scenarioId)}</td>
                <td><span class="badge ${s.difficulty==='easy'?'badge-green':s.difficulty==='hard'?'badge-red':'badge-amber'}">${diffLabels[s.difficulty]||s.difficulty}</span></td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="progress-bar" style="width:80px">
                      <div class="progress-fill ${s.independenceScore>=70?'green':''}" style="width:${s.independenceScore}%"></div>
                    </div>
                    <span style="font-weight:800;font-size:0.85rem">${s.independenceScore}%</span>
                  </div>
                </td>
                <td>${s.hintsUsed}</td>
                <td>${dur} dk</td>
                <td><span class="badge ${s.timePenalty?'badge-amber':'badge-green'}">${s.timePenalty?'⏰ Süre':'✅ Tam'}</span></td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  },

  initCharts() {
    const user = Auth.currentUser;
    const sessions = DB.getSessionsByUser(user.id).filter(s => s.completed);
    if (!sessions.length) return;

    // -- Trend chart (inline SVG canvas) --
    this._drawTrendChart(sessions);
    this._drawBreakdownChart(sessions);
    this._drawHintChart(sessions);
  },

  _drawTrendChart(sessions) {
    const canvas = document.getElementById('trend-chart');
    if (!canvas) return;
    const sorted = sessions.slice().sort((a,b) => new Date(a.startedAt)-new Date(b.startedAt)).slice(-10);
    const W = canvas.offsetWidth || 400, H = 160;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scores = sorted.map(s => s.independenceScore);
    const maxY = 100, minY = 0, padL = 36, padR = 20, padT = 16, padB = 30;
    const chartW = W - padL - padR, chartH = H - padT - padB;

    ctx.clearRect(0,0,W,H);

    // Grid lines
    [0,25,50,75,100].forEach(v => {
      const y = padT + chartH - (v/100)*chartH;
      ctx.beginPath(); ctx.strokeStyle='#DDE3F0'; ctx.lineWidth=1;
      ctx.moveTo(padL,y); ctx.lineTo(W-padR,y); ctx.stroke();
      ctx.fillStyle='#8A97B8'; ctx.font='10px Nunito,sans-serif';
      ctx.fillText(v+'%', 2, y+4);
    });

    if (scores.length < 2) {
      ctx.fillStyle='#4F8EF7'; ctx.font='bold 13px Nunito';
      ctx.fillText('Daha fazla seans tamamlayın', padL+20, H/2);
      return;
    }

    const xStep = chartW / (scores.length - 1);

    // Gradient fill
    const grad = ctx.createLinearGradient(0,padT,0,H-padB);
    grad.addColorStop(0,'rgba(79,142,247,0.25)');
    grad.addColorStop(1,'rgba(79,142,247,0)');
    ctx.beginPath();
    scores.forEach((v,i) => {
      const x = padL + i*xStep;
      const y = padT + chartH - ((v-minY)/(maxY-minY))*chartH;
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.lineTo(padL+(scores.length-1)*xStep, H-padB);
    ctx.lineTo(padL, H-padB);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    // Line
    ctx.beginPath(); ctx.strokeStyle='#4F8EF7'; ctx.lineWidth=2.5;
    ctx.lineJoin='round'; ctx.lineCap='round';
    scores.forEach((v,i) => {
      const x = padL + i*xStep;
      const y = padT + chartH - ((v-minY)/(maxY-minY))*chartH;
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.stroke();

    // Dots & labels
    scores.forEach((v,i) => {
      const x = padL + i*xStep;
      const y = padT + chartH - ((v-minY)/(maxY-minY))*chartH;
      ctx.beginPath(); ctx.fillStyle='#4F8EF7';
      ctx.arc(x,y,4,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.fillStyle='white';
      ctx.arc(x,y,2,0,Math.PI*2); ctx.fill();
      // x-axis label
      const d = new Date(sorted[i].startedAt);
      ctx.fillStyle='#8A97B8'; ctx.font='9px Nunito';
      ctx.fillText(`${d.getDate()}/${d.getMonth()+1}`, x-8, H-8);
    });
  },

  _drawBreakdownChart(sessions) {
    const canvas = document.getElementById('breakdown-chart');
    if (!canvas) return;
    const W = canvas.offsetWidth || 400, H = 160;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const counts = {};
    sessions.forEach(s => { counts[s.scenarioId] = (counts[s.scenarioId]||0)+1; });
    const entries = Object.entries(counts);
    if (!entries.length) return;

    const colors = ['#4F8EF7','#22C55E','#F59E0B','#8B5CF6','#14B8A6'];
    const total = entries.reduce((a,[,v])=>a+v,0);
    let startAngle = -Math.PI/2;
    const cx = W*0.4, cy = H/2, r = Math.min(cx, cy) - 16;

    entries.forEach(([id, count], i) => {
      const slice = (count/total) * Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,startAngle,startAngle+slice);
      ctx.closePath();
      ctx.fillStyle = colors[i%colors.length];
      ctx.fill();
      ctx.strokeStyle='white'; ctx.lineWidth=2; ctx.stroke();
      startAngle += slice;
    });

    // Legend
    entries.forEach(([id, count], i) => {
      const y = 24 + i*22;
      ctx.fillStyle = colors[i%colors.length];
      ctx.fillRect(W*0.75, y-8, 12, 12);
      ctx.fillStyle='#4B5A7A'; ctx.font='11px Nunito,sans-serif';
      ctx.fillText(`${t('scenario_'+id)||id} (${count})`, W*0.75+16, y+2);
    });
  },

  _drawHintChart(sessions) {
    const canvas = document.getElementById('hint-chart');
    if (!canvas) return;
    const W = canvas.offsetWidth || 700, H = 100;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sorted = sessions.slice().sort((a,b)=>new Date(a.startedAt)-new Date(b.startedAt)).slice(-10);
    const data = sorted.map(s => s.hintsUsed);
    const maxVal = Math.max(...data, 1);
    const padL=36, padR=20, padT=10, padB=30;
    const chartW = W-padL-padR, chartH = H-padT-padB;
    const barW = Math.min(chartW/data.length - 8, 48);

    ctx.clearRect(0,0,W,H);

    data.forEach((v,i) => {
      const x = padL + (i/(data.length))*(chartW) + (chartW/data.length - barW)/2;
      const barH = (v/maxVal)*chartH;
      const y = padT + chartH - barH;
      const color = v===0 ? '#22C55E' : v<=2 ? '#F59E0B' : '#EF4444';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 4);
      ctx.fill();
      ctx.fillStyle='#4B5A7A'; ctx.font='10px Nunito'; ctx.textAlign='center';
      ctx.fillText(v, x+barW/2, y-4);
      const d = new Date(sorted[i].startedAt);
      ctx.fillStyle='#8A97B8';
      ctx.fillText(`${d.getDate()}/${d.getMonth()+1}`, x+barW/2, H-8);
    });

    // Y axis label
    ctx.fillStyle='#8A97B8'; ctx.font='9px Nunito'; ctx.textAlign='left';
    [0, Math.ceil(maxVal/2), maxVal].forEach(v => {
      const y = padT + chartH - (v/maxVal)*chartH;
      ctx.fillText(v, 2, y+4);
    });
  },

  exportPDF() {
    const user = Auth.currentUser;
    const sessions = DB.getSessionsByUser(user.id).filter(s => s.completed);
    const stats = DB.getUserStats(user.id);

    const rows = sessions.slice().reverse().map(s => {
      const date = new Date(s.startedAt).toLocaleDateString();
      const dur = Math.round(s.totalDuration/60);
      return `<tr>
        <td>${date}</td>
        <td>${t('scenario_'+s.scenarioId)||s.scenarioId}</td>
        <td>${s.difficulty}</td>
        <td>${s.independenceScore}%</td>
        <td>${s.hintsUsed}</td>
        <td>${dur} dk</td>
        <td>${s.timePenalty?'Süre Doldu':'Tamamlandı'}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="${currentLang}">
<head>
<meta charset="UTF-8">
<title>ASSIST-AI Rapor - ${user.firstName} ${user.lastName}</title>
<style>
  body{font-family:Arial,sans-serif;padding:32px;color:#1E2A4A;max-width:800px;margin:0 auto}
  h1{color:#2563EB;border-bottom:3px solid #2563EB;padding-bottom:10px}
  h2{color:#4B5A7A;margin-top:24px}
  .stat-row{display:flex;gap:24px;margin:16px 0}
  .stat-box{background:#EBF2FF;border-radius:10px;padding:14px 20px;flex:1;text-align:center}
  .stat-val{font-size:2rem;font-weight:900;color:#2563EB}
  .stat-lbl{font-size:0.8rem;color:#4B5A7A;font-weight:600}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th{background:#EBF2FF;padding:10px;font-size:0.8rem;text-align:left;border-bottom:2px solid #DDE3F0}
  td{padding:9px;border-bottom:1px solid #DDE3F0;font-size:0.85rem}
  tr:nth-child(even){background:#F8FAFF}
  .footer{margin-top:32px;font-size:0.75rem;color:#8A97B8;border-top:1px solid #DDE3F0;padding-top:12px}
</style>
</head>
<body>
  <h1>ASSIST-AI — ${t('reports_title')}</h1>
  <p><strong>${user.firstName} ${user.lastName}</strong> | ${new Date().toLocaleDateString()} | ${t('country_label')}: ${user.country||'—'}</p>
  <div class="stat-row">
    <div class="stat-box"><div class="stat-val">${stats.total}</div><div class="stat-lbl">${t('total_sessions')}</div></div>
    <div class="stat-box"><div class="stat-val">${stats.avgIndependence}%</div><div class="stat-lbl">${t('avg_independence')}</div></div>
    <div class="stat-box"><div class="stat-val">${stats.totalMinutes} dk</div><div class="stat-lbl">${t('total_time')}</div></div>
  </div>
  <h2>${t('session_history')}</h2>
  <table>
    <thead><tr><th>Tarih</th><th>Senaryo</th><th>Zorluk</th><th>Bağımsızlık</th><th>İpucu</th><th>Süre</th><th>Durum</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Bu rapor ASSIST-AI platformu tarafından otomatik oluşturulmuştur. | ${new Date().toISOString()}</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
};
