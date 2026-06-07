// import { useState } from "react";

// const scenarios = [
//   {
//     id: 1,
//     emoji: "🛒",
//     title: "Markete Gitme",
//     description: "Ürün seçme, kasaya gitme ve ödeme yapma",
//     level: "Kolay",
//     levelColor: "bg-green-100 text-green-800",
//     color: "from-green-50 to-emerald-50",
//     border: "border-green-200",
//     iconBg: "bg-green-100",
//     duration: "~10 dk",
//   },
//   {
//     id: 2,
//     emoji: "🚌",
//     title: "Otobüse Binme",
//     description: "Durakta bekleme, bilet alma ve yolculuk",
//     level: "Kolay",
//     levelColor: "bg-green-100 text-green-800",
//     color: "from-blue-50 to-sky-50",
//     border: "border-blue-200",
//     iconBg: "bg-blue-100",
//     duration: "~8 dk",
//   },
//   {
//     id: 3,
//     emoji: "🍽️",
//     title: "Restoranda Sipariş",
//     description: "Masaya oturma, menü okuma ve sipariş verme",
//     level: "Orta",
//     levelColor: "bg-yellow-100 text-yellow-800",
//     color: "from-orange-50 to-amber-50",
//     border: "border-orange-200",
//     iconBg: "bg-orange-100",
//     duration: "~15 dk",
//   },
//   {
//     id: 4,
//     emoji: "🏥",
//     title: "Doktora Gitme",
//     description: "Randevu alma, bekleme salonu ve muayene",
//     level: "Orta",
//     levelColor: "bg-yellow-100 text-yellow-800",
//     color: "from-teal-50 to-cyan-50",
//     border: "border-teal-200",
//     iconBg: "bg-teal-100",
//     duration: "~12 dk",
//   },
//   {
//     id: 5,
//     emoji: "🏦",
//     title: "Bankaya Gitme",
//     description: "Sıra alma, işlem yapma ve çıkış",
//     level: "Zor",
//     levelColor: "bg-red-100 text-red-800",
//     color: "from-purple-50 to-violet-50",
//     border: "border-purple-200",
//     iconBg: "bg-purple-100",
//     duration: "~20 dk",
//   },
//   {
//     id: 6,
//     emoji: "📞",
//     title: "Telefon Görüşmesi",
//     description: "Aramaya başlama, konuşma ve kapama",
//     level: "Zor",
//     levelColor: "bg-red-100 text-red-800",
//     color: "from-rose-50 to-pink-50",
//     border: "border-rose-200",
//     iconBg: "bg-rose-100",
//     duration: "~18 dk",
//   },
// ];

// const stats = [
//   { label: "Tamamlanan", value: "3", icon: "⭐" },
//   { label: "Kazanılan Puan", value: "150", icon: "🏆" },
//   { label: "Günlük Seri", value: "5 gün", icon: "🔥" },
// ];

// export default function HomePage() {
//   const [selected, setSelected] = useState(null);
//   const [filter, setFilter] = useState("Tümü");

//   const filters = ["Tümü", "Kolay", "Orta", "Zor"];
//   const filtered =
//     filter === "Tümü"
//       ? scenarios
//       : scenarios.filter((s) => s.level === filter);

//   return (
//     <div className="min-h-screen bg-amber-50 font-sans">

//       {/* Header */}
//       <header className="bg-white border-b-2 border-amber-200 px-6 py-5 flex items-center justify-between shadow-sm">
//         <div className="flex items-center gap-3">
//           <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
//             🌟
//           </div>
//           <div>
//             <h1 className="text-2xl font-bold text-amber-900 leading-tight">
//               Hayat Kolay
//             </h1>
//             <p className="text-sm text-amber-600 font-medium">
//               Gerçek hayat alıştırmaları
//             </p>
//           </div>
//         </div>
//         <div className="flex items-center gap-3">
//           <div className="bg-amber-100 rounded-2xl px-4 py-2 text-center hidden sm:block">
//             <p className="text-xs text-amber-600 font-medium">Merhaba 👋</p>
//             <p className="text-sm text-amber-900 font-bold">Ahmet</p>
//           </div>
//           <div className="w-11 h-11 bg-amber-200 rounded-full flex items-center justify-center text-xl cursor-pointer hover:bg-amber-300 transition-colors">
//             👤
//           </div>
//         </div>
//       </header>

//       <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">

//         {/* Hoşgeldin Kartı */}
//         <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-3xl p-6 text-white shadow-md">
//           <div className="flex items-start gap-4">
//             <div className="text-5xl">😊</div>
//             <div className="flex-1">
//               <h2 className="text-xl font-bold mb-1">Bugün ne öğrenmek istersin?</h2>
//               <p className="text-amber-100 text-sm leading-relaxed">
//                 Her senaryo seni adım adım yönlendirecek. İstediğin zaman durabilirsin.
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* İstatistikler */}
//         <div className="grid grid-cols-3 gap-3">
//           {stats.map((s) => (
//             <div
//               key={s.label}
//               className="bg-white rounded-2xl p-4 text-center border-2 border-amber-100 shadow-sm"
//             >
//               <div className="text-3xl mb-1">{s.icon}</div>
//               <div className="text-2xl font-bold text-amber-900">{s.value}</div>
//               <div className="text-xs text-amber-600 font-medium mt-0.5">{s.label}</div>
//             </div>
//           ))}
//         </div>

//         {/* Filtreler */}
//         <div>
//           <h2 className="text-lg font-bold text-amber-900 mb-3">Senaryo Seç</h2>
//           <div className="flex gap-2 flex-wrap">
//             {filters.map((f) => (
//               <button
//                 key={f}
//                 onClick={() => setFilter(f)}
//                 className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
//                   filter === f
//                     ? "bg-amber-400 text-white shadow-md scale-105"
//                     : "bg-white text-amber-700 border-2 border-amber-200 hover:border-amber-400"
//                 }`}
//               >
//                 {f}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Senaryo Kartları */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           {filtered.map((s) => (
//             <button
//               key={s.id}
//               onClick={() => setSelected(s)}
//               className={`bg-gradient-to-br ${s.color} border-2 ${s.border} rounded-3xl p-5 text-left transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-amber-300`}
//             >
//               <div className="flex items-start gap-4">
//                 <div className={`${s.iconBg} rounded-2xl w-16 h-16 flex items-center justify-center text-4xl flex-shrink-0`}>
//                   {s.emoji}
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <h3 className="text-lg font-bold text-gray-800 leading-tight">
//                     {s.title}
//                   </h3>
//                   <p className="text-sm text-gray-600 mt-1 leading-relaxed">
//                     {s.description}
//                   </p>
//                   <div className="flex items-center gap-2 mt-3">
//                     <span className={`text-xs font-bold px-3 py-1 rounded-full ${s.levelColor}`}>
//                       {s.level}
//                     </span>
//                     <span className="text-xs text-gray-500 font-medium">
//                       ⏱ {s.duration}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </button>
//           ))}
//         </div>

//         {/* İpucu Kartı */}
//         <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-5 flex gap-4 items-start">
//           <div className="text-3xl">💡</div>
//           <div>
//             <h3 className="font-bold text-blue-900 mb-1">İpucu</h3>
//             <p className="text-sm text-blue-700 leading-relaxed">
//               Senaryo sırasında istediğin zaman <strong>"Duraklat"</strong> butonuna basabilirsin. Acele etmene gerek yok!
//             </p>
//           </div>
//         </div>

//       </main>

//       {/* Modal */}
//       {selected && (
//         <div
//           className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4"
//           onClick={() => setSelected(null)}
//         >
//           <div
//             className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="text-center mb-5">
//               <div className="text-6xl mb-3">{selected.emoji}</div>
//               <h2 className="text-2xl font-bold text-gray-800">{selected.title}</h2>
//               <p className="text-gray-500 mt-2 text-sm leading-relaxed">
//                 {selected.description}
//               </p>
//             </div>

//             <div className="bg-amber-50 rounded-2xl p-4 mb-5 space-y-2">
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-500 font-medium">Zorluk</span>
//                 <span className="font-bold text-gray-800">{selected.level}</span>
//               </div>
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-500 font-medium">Süre</span>
//                 <span className="font-bold text-gray-800">{selected.duration}</span>
//               </div>
//             </div>

//             <div className="space-y-3">
//               <button className="w-full bg-amber-400 hover:bg-amber-500 text-white font-bold py-4 rounded-2xl text-lg transition-colors shadow-md">
//                 🚀 Başla
//               </button>
//               <button
//                 onClick={() => setSelected(null)}
//                 className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-2xl transition-colors"
//               >
//                 Geri Dön
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//     </div>
//   );
// }







import { useState } from "react";
import MarketScenario from "../scenarios/MarketScenario";

const scenarios = [
  { id: 1, emoji: "🛒", title: "Alışveriş Yapmak", description: "Ürün seçme, kasaya gitme ve ödeme yapma", level: "Kolay", levelColor: "bg-green-100 text-green-800", color: "from-green-50 to-emerald-50", border: "border-green-200", iconBg: "bg-green-100",  component: "market" },
  { id: 2, emoji: "🚌", title: "Otobüse Binme", description: "Durakta bekleme, bilet alma ve yolculuk", level: "Kolay", levelColor: "bg-green-100 text-green-800", color: "from-blue-50 to-sky-50", border: "border-blue-200", iconBg: "bg-blue-100", component: null },
  { id: 3, emoji: "🍽️", title: "Restoranda Sipariş", description: "Masaya oturma, menü okuma ve sipariş verme", level: "Orta", levelColor: "bg-yellow-100 text-yellow-800", color: "from-orange-50 to-amber-50", border: "border-orange-200", iconBg: "bg-orange-100",  component: null },
  { id: 4, emoji: "🏥", title: "Doktora Gitme", description: "Randevu alma, bekleme salonu ve muayene", level: "Orta", levelColor: "bg-yellow-100 text-yellow-800", color: "from-teal-50 to-cyan-50", border: "border-teal-200", iconBg: "bg-teal-100",  component: null },
  { id: 5, emoji: "🏦", title: "Bankaya Gitme", description: "Sıra alma, işlem yapma ve çıkış", level: "Zor", levelColor: "bg-red-100 text-red-800", color: "from-purple-50 to-violet-50", border: "border-purple-200", iconBg: "bg-purple-100",  component: null },
  { id: 6, emoji: "📞", title: "Telefon Görüşmesi", description: "Aramaya başlama, konuşma ve kapama", level: "Zor", levelColor: "bg-red-100 text-red-800", color: "from-rose-50 to-pink-50", border: "border-rose-200", iconBg: "bg-rose-100",  component: null },
];

const stats = [
  { label: "Tamamlanan", value: "3", icon: "⭐" },
  { label: "Kazanılan Puan", value: "150", icon: "🏆" },
  { label: "Günlük Seri", value: "5 gün", icon: "🔥" },
];

export default function App() {
  const [selected, setSelected] = useState(null);
  const [activeScenario, setActiveScenario] = useState(null);
  const [filter, setFilter] = useState("Tümü");

  if (activeScenario === "market") {
    return <MarketScenario onExit={() => setActiveScenario(null)} />;
  }

  const filters = ["Tümü", "Kolay", "Orta", "Zor"];
  const filtered = filter === "Tümü" ? scenarios : scenarios.filter((s) => s.level === filter);

  return (
    <div className="min-h-screen bg-amber-50 font-sans">
      <header className="bg-white border-b-2 border-amber-200 px-6 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center text-2xl shadow-sm">🌟</div>
          <div>
            <h1 className="text-2xl font-bold text-amber-900 leading-tight">Assist AI</h1>
            <p className="text-sm text-amber-600 font-medium">Gerçek hayat alıştırmaları</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-amber-100 rounded-2xl px-4 py-2 text-center hidden sm:block">
            <p className="text-xs text-amber-600 font-medium">Merhaba 👋</p>
            <p className="text-sm text-amber-900 font-bold">Ahmet</p>
          </div>
          <div className="w-11 h-11 bg-amber-200 rounded-full flex items-center justify-center text-xl cursor-pointer hover:bg-amber-300 transition-colors">👤</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        

        <div className="text-xl text-center font-bold text-amber-900">Senaryolar</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className={`bg-gradient-to-br ${s.color} border-2 ${s.border} rounded-3xl p-5 text-left transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-amber-300`}
            >
              <div className="flex items-start gap-4">
                <div className={`${s.iconBg} rounded-2xl w-16 h-16 flex items-center justify-center text-4xl flex-shrink-0`}>
                  {s.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-800 leading-tight">{s.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{s.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${s.levelColor}`}>{s.level}</span>
                    <span className="text-xs text-gray-500 font-medium">⏱ {s.duration}</span>
                    {s.component && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">🎮 Oynanabilir</span>}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-5 flex gap-4 items-start">
          <div className="text-3xl">💡</div>
          <div>
            <h3 className="font-bold text-blue-900 mb-1">İpucu</h3>
            <p className="text-sm text-blue-700 leading-relaxed">
              Senaryo sırasında istediğin zaman <strong>"Geri Dön"</strong> butonuna basabilirsin. Acele etmene gerek yok!
            </p>
          </div>
        </div>
      </main>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-6xl mb-3">{selected.emoji}</div>
              <h2 className="text-2xl font-bold text-gray-800">{selected.title}</h2>
              <p className="text-gray-500 mt-2 text-sm leading-relaxed">{selected.description}</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Zorluk</span>
                <span className="font-bold text-gray-800">{selected.level}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Süre</span>
                <span className="font-bold text-gray-800">{selected.duration}</span>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => { setSelected(null); if (selected.component) setActiveScenario(selected.component); }}
                className="w-full bg-amber-400 hover:bg-amber-500 text-white font-bold py-4 rounded-2xl text-lg transition-colors shadow-md"
              >
                🚀 Başla
              </button>
              <button onClick={() => setSelected(null)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-2xl transition-colors">
                Geri Dön
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}