# ASSIST-AI — Beceri Antrenmanı Platformu

Otizmli genç yetişkin bireyler için yapay zekâ destekli sanal asistan ve senaryo tabanlı beceri antrenmanı platformu.

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+ (backend için)
- Modern web tarayıcı (frontend tek başına çalışır)

### Sadece Frontend (Tarayıcıda Aç)
```bash
# frontend/index.html dosyasını doğrudan tarayıcıda aç
open frontend/index.html
```

### Tam Uygulama (Backend + Frontend)
```bash
npm install
npm start
# → http://localhost:3000
```

## 👤 Demo Giriş Bilgileri
Herhangi bir e-posta ve şifre ile giriş yapabilirsiniz. Sistem otomatik olarak hesap oluşturur.

Hazır demo hesapları:
- `demo@example.com` — Kullanıcı (Ali Yılmaz, Türkiye)
- `thomas@example.com` — Kullanıcı (Thomas Müller, Almanya)
- `admin@example.com` — Yönetici

## 🌍 Desteklenen Diller
- 🇹🇷 Türkçe
- 🇬🇧 English
- 🇩🇪 Deutsch
- 🇫🇷 Français
- 🇪🇸 Español
- 🇵🇹 Português

## 📁 Proje Yapısı
```
assist-ai/
├── frontend/
│   ├── index.html          # Ana HTML
│   ├── css/
│   │   ├── main.css        # Ana stiller
│   │   ├── login.css       # Giriş & GDPR stili
│   │   └── scenarios.css   # Senaryo & simülasyon stili
│   └── js/
│       ├── i18n.js         # Çoklu dil modülü (6 dil)
│       ├── db.js           # Yerel veritabanı (localStorage)
│       ├── auth.js         # Kimlik doğrulama
│       ├── scenarios.js    # Senaryo & simülasyon motoru
│       ├── reports.js      # Raporlama modülü
│       ├── consent.js      # Onam formu oluşturucu
│       └── app.js          # Ana uygulama kontrolcüsü
├── server.js               # Express.js backend
├── package.json
└── README.md
```

## ✨ Özellikler

### 🔐 Kimlik Doğrulama & GDPR
- KVKK/GDPR onay ekranı (6 dil)
- Kullanıcı/Ebeveyn/Terapist/Admin rolleri
- Kayıt & giriş
- Oturum yönetimi

### 🎭 Senaryolar
- **Alışveriş Senaryosu** (tam simülasyon)
- Otobüse Binme (yakında)
- Kafede Sipariş (yakında)
- 3 zorluk seviyesi: Kolay/Orta/Zor
- Süre limiti ve puan cezası
- İpucu seviyelendirme (genel/açık/direkt)
- Duygu düzenleme ekranı
- Görevliye sorma mikro adımları

### 📊 Raporlama
- Bağımsızlık trendi grafiği
- Senaryo dağılımı
- İpucu kullanım analizi
- Seans geçmişi tablosu
- PDF dışa aktarma (yazdırılabilir)

### 📋 Onam Formu
- 6 dilde bilgilendirilmiş onam belgesi
- Ebeveyn/vasi imza alanları
- Yazdırılabilir PDF

### 🌍 Admin Paneli
- Ülke bazlı istatistikler
- Tüm kullanıcılar ve seanslar
- Global rapor dışa aktarma

## 🏗 Mimari
- **Frontend**: Vanilla JS, CSS3, HTML5 (framework bağımlılığı yok)
- **Backend**: Node.js + Express
- **Veritabanı**: localStorage (frontend) / JSON dosyalar (backend)
- **Çoklu dil**: Yerleşik i18n sistemi
- **PDF**: Tarayıcı print API

## 📈 Ölçme Mantığı
```
Bağımsızlık Puanı = Σ(tamamlanan_adım × yardım_ağırlığı) / toplam_adım × 100

Yardım ağırlıkları:
  Bağımsız    = 1.00 (100%)
  Genel ipucu = 0.75 (75%)
  Açık ipucu  = 0.50 (50%)
  Direkt yardım = 0.25 (25%)
  Atlandı     = 0.00 (0%)

Süre cezası: Zaman dolduğunda -15 puan
```
