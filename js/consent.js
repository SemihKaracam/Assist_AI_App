/* consent.js — Informed consent form generation */

const ConsentModule = {
  renderPage() {
    const user = Auth.currentUser;
    const existing = DB.getConsentByUser(user.id);
    return `
      <div class="page-header anim-fade">
        <h1>${t('consent_title')}</h1>
        <p>${t('consent_subtitle')}</p>
      </div>

      <div class="grid-2 anim-fade">
        <!-- User info card -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">👤 Kişi Bilgileri</span>
          </div>
          <div id="consent-user-info">
            ${this._renderUserInfo(user)}
          </div>
        </div>

        <!-- Consent history -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">📋 Onam Geçmişi</span>
          </div>
          <div>
            ${existing.length ? existing.map(c => `
              <div style="padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
                <div style="font-weight:700;font-size:0.85rem">${new Date(c.createdAt).toLocaleDateString()}</div>
                <div style="font-size:0.8rem;color:var(--text-mid)">${c.lang.toUpperCase()} | ${c.signedBy}</div>
                <button class="btn-icon" style="margin-top:8px" onclick="ConsentModule.downloadConsent('${c.id}')">${t('download_consent')}</button>
              </div>`).join('')
            : '<p style="color:var(--text-light);font-size:0.85rem">Henüz onam formu oluşturulmamış.</p>'}
          </div>
        </div>
      </div>

      <!-- Generate new consent -->
      <div class="card" style="margin-top:24px">
        <div class="card-header">
          <span class="card-title">📝 Yeni Onam Formu Oluştur</span>
        </div>
        <div class="grid-2">
          <div>
            <div class="form-group">
              <label>Dil Seçin</label>
              <select id="consent-lang">
                <option value="tr">🇹🇷 Türkçe</option>
                <option value="en">🇬🇧 English</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="es">🇪🇸 Español</option>
                <option value="pt">🇵🇹 Português</option>
              </select>
            </div>
            <div class="form-group">
              <label>İmzalayan (Ebeveyn/Vasi Adı)</label>
              <input type="text" id="consent-signer" value="${user.parentName || ''}" placeholder="Ad Soyad" />
            </div>
            <div class="form-group">
              <label>İmzalayan Rolü</label>
              <select id="consent-signer-role">
                <option value="parent">Ebeveyn</option>
                <option value="guardian">Vasi</option>
                <option value="therapist">Terapist</option>
                <option value="self">Bireyin Kendisi</option>
              </select>
            </div>
            <div class="form-group">
              <label>Tarih</label>
              <input type="date" id="consent-date" value="${new Date().toISOString().split('T')[0]}" />
            </div>
          </div>
          <div>
            <div class="form-group">
              <label>Ek Notlar / Özel Koşullar</label>
              <textarea id="consent-notes" rows="4" placeholder="İsteğe bağlı notlar..."></textarea>
            </div>
            <div style="background:var(--blue-light);border-radius:8px;padding:14px;font-size:0.8rem;color:var(--blue-dark);margin-top:8px">
              ℹ️ Onam formu seçilen dilde fiziksel belge olarak oluşturulur. Yazdırılıp ıslak imza ile imzalanabilir.
            </div>
          </div>
        </div>
        <div style="margin-top:16px;display:flex;gap:12px">
          <button class="btn-primary" onclick="ConsentModule.generateConsent()">${t('generate_consent')}</button>
          <button class="btn-secondary" onclick="ConsentModule.previewConsent()">👁 Önizle</button>
        </div>
      </div>
    `;
  },

  _renderUserInfo(user) {
    const fields = [
      ['Ad Soyad', `${user.firstName||''} ${user.lastName||''}`],
      ['E-posta', user.email||'—'],
      ['Doğum Tarihi', user.birthDate || '—'],
      ['Ülke', user.country || '—'],
      ['Ebeveyn Adı', user.parentName || '—'],
      ['Ebeveyn E-posta', user.parentEmail || '—'],
      ['Tanı Notu', user.diagnosis || '—'],
      ['KVKK Onay Tarihi', user.gdprConsentDate ? new Date(user.gdprConsentDate).toLocaleDateString() : '—'],
    ];
    return fields.map(([label, val]) => `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.85rem">
        <span style="color:var(--text-mid);font-weight:700">${label}</span>
        <span style="font-weight:600">${val}</span>
      </div>`).join('');
  },

  generateConsent() {
    const user = Auth.currentUser;
    const lang = document.getElementById('consent-lang').value;
    const signer = document.getElementById('consent-signer').value.trim();
    const role = document.getElementById('consent-signer-role').value;
    const date = document.getElementById('consent-date').value;
    const notes = document.getElementById('consent-notes').value.trim();

    if (!signer) { Auth._toast('İmzalayan adı gerekli', 'error'); return; }

    const consent = DB.saveConsent({
      id: 'con_' + Date.now(),
      userId: user.id,
      lang, signer, role, date, notes,
      createdAt: new Date().toISOString()
    });

    Auth._toast('Onam formu oluşturuldu!', 'success');
    this._openConsentDoc(user, consent);
    App.navigate('consent'); // refresh
  },

  previewConsent() {
    const user = Auth.currentUser;
    const lang = document.getElementById('consent-lang').value;
    const signer = document.getElementById('consent-signer').value || '________________';
    const date = document.getElementById('consent-date').value || new Date().toISOString().split('T')[0];
    const notes = document.getElementById('consent-notes').value;
    this._openConsentDoc(user, { lang, signer, date, notes, role: 'parent' });
  },

  downloadConsent(consentId) {
    const consent = DB.getConsents().find(c => c.id === consentId);
    const user = Auth.currentUser;
    if (consent) this._openConsentDoc(user, consent);
  },

  _openConsentDoc(user, consent) {
    const html = this._buildConsentHTML(user, consent);
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 600);
  },

  _buildConsentHTML(user, consent) {
    const lang = consent.lang || 'tr';
    const T = TRANSLATIONS[lang] || TRANSLATIONS['tr'];
    const tl = k => T[k] || TRANSLATIONS['tr'][k] || k;

    const titles = {
      tr: { title: 'BİLGİLENDİRİLMİŞ ONAM FORMU', subtitle: 'ASSIST-AI Beceri Antrenmanı Platformu', org: 'Kuruluş', participant: 'Katılımcı Bilgileri', parent: 'Ebeveyn/Vasi Bilgileri', purpose: 'Çalışmanın Amacı', purposeText: 'Bu form, otizmli bireylere yönelik tasarlanmış ASSIST-AI platformunun kullanımına ilişkin bilgilendirilmiş onayı belgeler.', risks: 'Gizlilik ve Güvenlik', risksText: 'Toplanan tüm veriler KVKK ve GDPR kapsamında korunmaktadır. Kişisel veriler üçüncü taraflarla paylaşılmaz. Veriler yalnızca terapötik değerlendirme amacıyla kullanılır.', rights: 'Katılımcı Hakları', rightsText: 'Katılımcı, onayını istediği zaman geri çekme hakkına sahiptir. Verilerinin silinmesini talep edebilir.', sign_participant: 'Katılımcı / Temsilci İmzası', sign_guardian: 'Ebeveyn / Vasi İmzası', sign_date: 'Tarih', name: 'Ad Soyad', relation: 'Yakınlık Derecesi', notes: 'Özel Notlar' },
      en: { title: 'INFORMED CONSENT FORM', subtitle: 'ASSIST-AI Skills Training Platform', org: 'Organization', participant: 'Participant Information', parent: 'Parent / Guardian Information', purpose: 'Purpose of the Study', purposeText: 'This form documents informed consent for using the ASSIST-AI platform designed for individuals with autism.', risks: 'Privacy and Security', risksText: 'All collected data is protected under GDPR. Personal data is not shared with third parties and is used solely for therapeutic assessment.', rights: 'Participant Rights', rightsText: 'The participant has the right to withdraw consent at any time and may request deletion of their data.', sign_participant: 'Participant / Representative Signature', sign_guardian: 'Parent / Guardian Signature', sign_date: 'Date', name: 'Full Name', relation: 'Relationship', notes: 'Special Notes' },
      de: { title: 'EINWILLIGUNGSERKLÄRUNG', subtitle: 'ASSIST-AI Kompetenztraining-Plattform', org: 'Organisation', participant: 'Teilnehmerinformationen', parent: 'Eltern / Vormund', purpose: 'Zweck der Studie', purposeText: 'Dieses Formular dokumentiert die informierte Einwilligung zur Nutzung der ASSIST-AI-Plattform.', risks: 'Datenschutz', risksText: 'Alle gesammelten Daten sind nach DSGVO geschützt. Persönliche Daten werden nicht an Dritte weitergegeben.', rights: 'Teilnehmerrechte', rightsText: 'Der Teilnehmer hat das Recht, seine Einwilligung jederzeit zu widerrufen.', sign_participant: 'Teilnehmer-Unterschrift', sign_guardian: 'Eltern / Vormund Unterschrift', sign_date: 'Datum', name: 'Vor- und Nachname', relation: 'Verwandtschaftsgrad', notes: 'Besondere Hinweise' },
      fr: { title: 'FORMULAIRE DE CONSENTEMENT ÉCLAIRÉ', subtitle: 'Plateforme ASSIST-AI', org: 'Organisation', participant: 'Informations du participant', parent: 'Parent / Tuteur', purpose: 'Objectif', purposeText: 'Ce formulaire documente le consentement éclairé pour utiliser la plateforme ASSIST-AI.', risks: 'Confidentialité', risksText: 'Toutes les données collectées sont protégées par le RGPD.', rights: 'Droits du participant', rightsText: "Le participant peut retirer son consentement à tout moment.", sign_participant: 'Signature du participant', sign_guardian: 'Signature du parent/tuteur', sign_date: 'Date', name: 'Nom complet', relation: 'Lien de parenté', notes: 'Notes spéciales' },
      es: { title: 'FORMULARIO DE CONSENTIMIENTO INFORMADO', subtitle: 'Plataforma ASSIST-AI', org: 'Organización', participant: 'Información del participante', parent: 'Padre / Tutor', purpose: 'Propósito', purposeText: 'Este formulario documenta el consentimiento informado para usar la plataforma ASSIST-AI.', risks: 'Privacidad', risksText: 'Todos los datos recopilados están protegidos por el RGPD.', rights: 'Derechos del participante', rightsText: 'El participante puede retirar su consentimiento en cualquier momento.', sign_participant: 'Firma del participante', sign_guardian: 'Firma del padre/tutor', sign_date: 'Fecha', name: 'Nombre completo', relation: 'Parentesco', notes: 'Notas especiales' },
      pt: { title: 'FORMULÁRIO DE CONSENTIMENTO INFORMADO', subtitle: 'Plataforma ASSIST-AI', org: 'Organização', participant: 'Informações do participante', parent: 'Pai / Tutor', purpose: 'Objetivo', purposeText: 'Este formulário documenta o consentimento informado para usar a plataforma ASSIST-AI.', risks: 'Privacidade', risksText: 'Todos os dados recolhidos são protegidos pelo RGPD.', rights: 'Direitos do participante', rightsText: 'O participante pode retirar o seu consentimento a qualquer momento.', sign_participant: 'Assinatura do participante', sign_guardian: 'Assinatura do pai/tutor', sign_date: 'Data', name: 'Nome completo', relation: 'Parentesco', notes: 'Notas especiais' },
    };
    const L = titles[lang] || titles['tr'];

    const stats = DB.getUserStats(user.id);

    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<title>${L.title} — ${user.firstName} ${user.lastName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Nunito',Arial,sans-serif;padding:48px;color:#1E2A4A;max-width:820px;margin:0 auto;background:#fff}
  .header{text-align:center;border-bottom:3px solid #2563EB;padding-bottom:24px;margin-bottom:32px}
  .logo-circle{width:64px;height:64px;border-radius:50%;background:#2563EB;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:1.8rem;color:white}
  h1{color:#2563EB;font-size:1.3rem;font-weight:900;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px}
  h2{font-size:1rem;color:#4B5A7A;font-weight:400}
  .section{margin-bottom:28px}
  .section-title{font-size:0.85rem;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;color:#2563EB;border-left:4px solid #2563EB;padding-left:10px;margin-bottom:12px}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .info-row{display:flex;flex-direction:column;padding:8px;background:#F8FAFF;border-radius:6px}
  .info-label{font-size:0.7rem;font-weight:700;color:#8A97B8;text-transform:uppercase;letter-spacing:0.3px}
  .info-val{font-size:0.88rem;font-weight:700;margin-top:2px}
  .text-block{background:#F8FAFF;border-radius:8px;padding:14px;font-size:0.85rem;line-height:1.7;color:#4B5A7A;border-left:3px solid #DDE3F0}
  .stats-row{display:flex;gap:16px;margin:12px 0}
  .stat-box{flex:1;text-align:center;background:#EBF2FF;border-radius:8px;padding:12px}
  .stat-val{font-size:1.6rem;font-weight:900;color:#2563EB}
  .stat-lbl{font-size:0.7rem;color:#4B5A7A;font-weight:700}
  .sign-section{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:32px}
  .sign-box{border:1px solid #DDE3F0;border-radius:10px;padding:18px}
  .sign-box h4{font-size:0.8rem;color:#8A97B8;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.5px}
  .sign-line{border-bottom:2px solid #1E2A4A;margin:30px 0 8px;min-height:40px}
  .sign-label{font-size:0.72rem;color:#8A97B8}
  .notes-box{background:#FFFBEB;border-radius:8px;padding:14px;margin-top:16px;border:1px solid #FDE68A;font-size:0.85rem;min-height:60px}
  .footer{margin-top:32px;padding-top:16px;border-top:1px solid #DDE3F0;font-size:0.7rem;color:#8A97B8;display:flex;justify-content:space-between}
  @media print { body{padding:24px} .no-print{display:none} }
</style>
</head>
<body>
  <div class="header">
    <div class="logo-circle">🤖</div>
    <h1>${L.title}</h1>
    <h2>${L.subtitle}</h2>
  </div>

  <div class="section">
    <div class="section-title">${L.participant}</div>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">${L.name}</span><span class="info-val">${user.firstName} ${user.lastName}</span></div>
      <div class="info-row"><span class="info-label">E-mail</span><span class="info-val">${user.email}</span></div>
      <div class="info-row"><span class="info-label">${L.sign_date}</span><span class="info-val">${user.birthDate||'—'}</span></div>
      <div class="info-row"><span class="info-label">${L.org}</span><span class="info-val">${user.country||'—'}</span></div>
    </div>
  </div>

  ${(user.parentName || user.parentEmail) ? `
  <div class="section">
    <div class="section-title">${L.parent}</div>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">${L.name}</span><span class="info-val">${user.parentName||'—'}</span></div>
      <div class="info-row"><span class="info-label">E-mail</span><span class="info-val">${user.parentEmail||'—'}</span></div>
    </div>
  </div>` : ''}

  <div class="section">
    <div class="section-title">📊 Performans Özeti</div>
    <div class="stats-row">
      <div class="stat-box"><div class="stat-val">${stats.total}</div><div class="stat-lbl">${tl('total_sessions')}</div></div>
      <div class="stat-box"><div class="stat-val">${stats.avgIndependence}%</div><div class="stat-lbl">${tl('avg_independence')}</div></div>
      <div class="stat-box"><div class="stat-val">${stats.totalMinutes} dk</div><div class="stat-lbl">${tl('total_time')}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${L.purpose}</div>
    <div class="text-block">${L.purposeText}</div>
  </div>

  <div class="section">
    <div class="section-title">${L.risks}</div>
    <div class="text-block">${L.risksText}</div>
  </div>

  <div class="section">
    <div class="section-title">${L.rights}</div>
    <div class="text-block">${L.rightsText}</div>
  </div>

  ${consent.notes ? `
  <div class="section">
    <div class="section-title">${L.notes}</div>
    <div class="notes-box">${consent.notes}</div>
  </div>` : ''}

  <div class="sign-section">
    <div class="sign-box">
      <h4>${L.sign_guardian}</h4>
      <div class="sign-line">${consent.signer ? `<span style="font-size:1.1rem;font-weight:700">${consent.signer}</span>` : ''}</div>
      <div class="sign-label">${L.name}: ${consent.signer || '________________'}</div>
      <div style="margin-top:8px">
        <div class="sign-line"></div>
        <div class="sign-label">${L.sign_date}: ${consent.date || '________________'}</div>
      </div>
    </div>
    <div class="sign-box">
      <h4>${L.sign_participant}</h4>
      <div class="sign-line"></div>
      <div class="sign-label">${L.name}: ${user.firstName} ${user.lastName}</div>
      <div style="margin-top:8px">
        <div class="sign-line"></div>
        <div class="sign-label">${L.sign_date}: ${consent.date || '________________'}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>ASSIST-AI Platform | assist-ai.app</span>
    <span>${new Date().toISOString()}</span>
    <span>ID: ${consent.id || 'PREVIEW'}</span>
  </div>
</body>
</html>`;
  }
};
