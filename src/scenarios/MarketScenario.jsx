// import { useState, useEffect, useRef, useCallback } from "react";

// // ─── Asset imports (src/assets/ klasöründen) ─────────────────────────────────
// import imgOverview from "../assets/alisveris_merkezi.png";
// import imgFruits from "../assets/meyve_sebze.png";
// import imgBakery from "../assets/firin.png";
// import imgDairy from "../assets/sut_urunleri.png";
// import imgKasa from "../assets/kasa.png";

// const IMG = {
//     overview: imgOverview,
//     fruits: imgFruits,
//     bakery: imgBakery,
//     dairy: imgDairy,
//     kasa: imgKasa,
// };

// // ─── Full product pools ───────────────────────────────────────────────────────
// const BAKERY_POOL = [
//     { id: "simit", name: "Simit", },
//     { id: "pogaca", name: "Açma / Poğaça", },
//     { id: "kruvasan", name: "Kruvasan", },
//     { id: "donut", name: "Çikolatalı Donut", },
//     { id: "baget", name: "Baget Ekmek", },
//     { id: "tam_bugday", name: "Tam Buğday Ekmek", },
//     { id: "sandvic", name: "Sandviç Ekmeği", },
//     { id: "borek", name: "Börek Dilimleri", },
//     { id: "kurabiye", name: "Kurabiye", },
// ];

// const DAIRY_POOL = [
//     { id: "sut", name: "Süt", },
//     { id: "kasar", name: "Kaşar Peyniri", },
//     { id: "yogurt", name: "Yoğurt", },
//     { id: "beyaz_peynir", name: "Beyaz Peynir", },
//     { id: "labne", name: "Labne / Krem Peynir", },
//     { id: "tereyagi", name: "Tereyağı", },
//     { id: "rendelenmis", name: "Rendelenmiş Kaşar", },
// ];

// const FRUITS_POOL = [
//     { id: "elma", name: "Elma", },
//     { id: "armut", name: "Armut", },
//     { id: "muz", name: "Muz", },
//     { id: "domates", name: "Domates", },
//     { id: "havuc", name: "Havuç", },
//     { id: "biber", name: "Biber", },
//     { id: "lahana", name: "Lahana", },
//     { id: "ananas", name: "Ananas", },
//     { id: "portakal", name: "Portakal", },
// ];

// const SECTION_META = {
//     dairy: { id: "dairy", label: "Süt Ürünleri", color: "#2563eb", hoverBg: "#dbeafe" },
//     fruits: { id: "fruits", label: "Meyve & Sebze", color: "#16a34a", hoverBg: "#dcfce7" },
//     bakery: { id: "bakery", label: "Fırın", color: "#d97706", hoverBg: "#fef3c7" },
//     kasa: { id: "kasa", label: "Kasa", color: "#7c3aed", hoverBg: "#ede9fe" },
// };

// function pickRandom(arr, n) {
//     const shuffled = [...arr].sort(() => Math.random() - 0.5);
//     return shuffled.slice(0, n);
// }

// function generateShoppingList() {
//     const dairy = pickRandom(DAIRY_POOL, 1);
//     const fruits = pickRandom(FRUITS_POOL, 2);
//     const bakery = pickRandom(BAKERY_POOL, 1);
//     return [
//         ...dairy.map(p => ({ ...p, section: "dairy" })),
//         ...fruits.map(p => ({ ...p, section: "fruits" })),
//         ...bakery.map(p => ({ ...p, section: "bakery" })),
//     ];
// }

// function formatTime(seconds) {
//     const m = Math.floor(seconds / 60);
//     const s = seconds % 60;
//     return `${m}:${s.toString().padStart(2, "0")}`;
// }

// // ─── Shelf overlay scene ──────────────────────────────────────────────────────
// function ShelfScene({ sectionId, shoppingList, collected, onPick, onBack }) {
//     const [feedback, setFeedback] = useState(null);

//     const poolMap = { bakery: BAKERY_POOL, dairy: DAIRY_POOL, fruits: FRUITS_POOL };
//     const products = poolMap[sectionId] || [];
//     const neededIds = shoppingList.filter(i => i.section === sectionId).map(i => i.id);

//     function handlePick(product) {
//         if (collected.includes(product.id)) {
//             setFeedback({ type: "already", name: product.name });
//             setTimeout(() => setFeedback(null), 1800);
//             return;
//         }
//         const isNeeded = neededIds.includes(product.id);
//         onPick(product, isNeeded);
//         setFeedback({ type: isNeeded ? "correct" : "wrong", name: product.name });
//         setTimeout(() => setFeedback(null), 1800);
//     }

//     // Layout: 3 rows × 3 cols grid to mimic shelf positions
//     const rows = [products.slice(0, 3), products.slice(3, 6), products.slice(6, 9)];

//     return (
//         <div
//             className="absolute inset-0 flex flex-col"
//             style={{
//                 backgroundImage: `url('${IMG[sectionId]}')`,
//                 backgroundSize: "cover",
//                 backgroundPosition: "center",
//             }}
//         >
//             {/* Dark overlay for readability */}
//             <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.38)" }} />

//             {/* Product buttons grid — positioned over shelves */}
//             <div className="relative flex-1 flex flex-col justify-around px-6 py-4" style={{ zIndex: 2 }}>
//                 {rows.map((row, ri) => (
//                     <div key={ri} className="flex justify-around items-center gap-3">
//                         {row.map((product) => {
//                             const isCollected = collected.includes(product.id);
//                             const isNeeded = neededIds.includes(product.id);
//                             return (
//                                 <button
//                                     key={product.id}
//                                     onClick={() => handlePick(product)}
//                                     disabled={isCollected}
//                                     className="flex flex-col items-center gap-1 rounded-2xl transition-all duration-200"
//                                     style={{
//                                         width: 110, padding: "10px 8px",
//                                         background: isCollected
//                                             ? "rgba(34,197,94,0.85)"
//                                             : isNeeded
//                                                 ? "rgba(255,255,255,0.95)"
//                                                 : "rgba(255,255,255,0.82)",
//                                         border: isNeeded && !isCollected
//                                             ? "2.5px solid #f59e0b"
//                                             : "2px solid rgba(255,255,255,0.5)",
//                                         boxShadow: isCollected ? "none" : "0 4px 16px rgba(0,0,0,0.35)",
//                                         cursor: isCollected ? "default" : "pointer",
//                                         transform: "scale(1)",
//                                     }}
//                                     onMouseEnter={e => { if (!isCollected) e.currentTarget.style.transform = "scale(1.08) translateY(-4px)"; }}
//                                     onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
//                                 >
//                                     <span style={{ fontSize: 28 }}>{isCollected ? "✅" : product.emoji}</span>
//                                     <span style={{ fontSize: 11, fontWeight: 700, color: isCollected ? "white" : "#1e293b", textAlign: "center", lineHeight: 1.2 }}>
//                                         {product.name}
//                                     </span>
//                                 </button>
//                             );
//                         })}
//                     </div>
//                 ))}
//             </div>

//             {/* Feedback toast */}
//             {feedback && (
//                 <div
//                     className="absolute left-1/2 rounded-2xl px-6 py-4 font-bold text-white text-base text-center"
//                     style={{
//                         top: "50%", transform: "translateX(-50%) translateY(-50%)",
//                         background: feedback.type === "correct"
//                             ? "rgba(22,163,74,0.96)"
//                             : feedback.type === "wrong"
//                                 ? "rgba(220,38,38,0.96)"
//                                 : "rgba(80,80,80,0.95)",
//                         zIndex: 30, pointerEvents: "none", whiteSpace: "nowrap", minWidth: 280,
//                         boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
//                     }}
//                 >
//                     {feedback.type === "correct" && `✅ Harika! ${feedback.name} sepete eklendi!`}
//                     {feedback.type === "wrong" && `❌ ${feedback.name} listende değil!`}
//                     {feedback.type === "already" && `📦 ${feedback.name} zaten sepette!`}
//                 </div>
//             )}

//             {/* Back button */}
//             <div className="relative p-4 flex-shrink-0" style={{ zIndex: 2 }}>
//                 <button
//                     onClick={onBack}
//                     className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-white"
//                     style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.25)", fontSize: 15 }}
//                 >
//                     ← Geri Dön
//                 </button>
//             </div>
//         </div>
//     );
// }

// // ─── Kasa scene ───────────────────────────────────────────────────────────────
// function KasaScene({ shoppingList, collected, onBack, onFinish }) {
//     const [payMethod, setPayMethod] = useState(null);
//     const [confirmed, setConfirmed] = useState(false);

//     function handlePay(method) {
//         setPayMethod(method);
//         setTimeout(() => {
//             setConfirmed(true);
//             setTimeout(() => onFinish(method), 1200);
//         }, 600);
//     }

//     return (
//         <div
//             className="absolute inset-0 flex flex-col items-center justify-center"
//             style={{
//                 backgroundImage: `url('${IMG.kasa}')`,
//                 backgroundSize: "cover",
//                 backgroundPosition: "center",
//             }}
//         >
//             <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.52)" }} />

//             <div
//                 className="relative rounded-3xl p-7 flex flex-col items-center gap-5"
//                 style={{
//                     zIndex: 2, background: "rgba(255,255,255,0.97)",
//                     width: "min(480px, 92vw)", boxShadow: "0 12px 48px rgba(0,0,0,0.4)",
//                 }}
//             >
//                 <div style={{ fontSize: 48 }}>🧾</div>
//                 <h2 className="text-2xl font-bold text-gray-800">Ödeme Yöntemi Seç</h2>

//                 {/* Mini receipt */}
//                 <div className="w-full rounded-2xl p-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
//                     <p className="font-bold text-gray-700 text-sm mb-2 text-center">Sepetinizdeki Ürünler</p>
//                     {shoppingList.map(item => {
//                         const done = collected.includes(item.id);
//                         return (
//                             <div key={item.id} className="flex justify-between items-center py-1.5" style={{ borderBottom: "1px solid #f1f5f9" }}>
//                                 <span style={{ color: done ? "#16a34a" : "#ef4444", fontSize: 13, fontWeight: 600 }}>
//                                     {done ? "✅" : "❌"} {item.name}
//                                 </span>
//                                 <span style={{ color: done ? "#16a34a" : "#9ca3af", fontSize: 12 }}>{done ? "Alındı" : "Alınmadı"}</span>
//                             </div>
//                         );
//                     })}
//                 </div>

//                 {confirmed ? (
//                     <div className="flex flex-col items-center gap-2">
//                         <div style={{ fontSize: 48 }}>✅</div>
//                         <p className="font-bold text-green-600 text-lg">
//                             {payMethod === "card" ? "Kart ile ödendi!" : "Nakit ödeme alındı!"}
//                         </p>
//                     </div>
//                 ) : (
//                     <div className="flex gap-4 w-full">
//                         <button
//                             onClick={() => handlePay("card")}
//                             className="flex-1 flex flex-col items-center gap-2 rounded-2xl py-5 font-bold transition-all"
//                             style={{ background: "#2563eb", color: "white", fontSize: 15, boxShadow: "0 4px 16px rgba(37,99,235,0.4)" }}
//                             onMouseEnter={e => e.currentTarget.style.background = "#1d4ed8"}
//                             onMouseLeave={e => e.currentTarget.style.background = "#2563eb"}
//                         >
//                             <span style={{ fontSize: 32 }}>💳</span>
//                             Kredi / Banka Kartı
//                         </button>
//                         <button
//                             onClick={() => handlePay("cash")}
//                             className="flex-1 flex flex-col items-center gap-2 rounded-2xl py-5 font-bold transition-all"
//                             style={{ background: "#16a34a", color: "white", fontSize: 15, boxShadow: "0 4px 16px rgba(22,163,74,0.4)" }}
//                             onMouseEnter={e => e.currentTarget.style.background = "#15803d"}
//                             onMouseLeave={e => e.currentTarget.style.background = "#16a34a"}
//                         >
//                             <span style={{ fontSize: 32 }}>💵</span>
//                             Nakit
//                         </button>
//                     </div>
//                 )}

//                 {!confirmed && (
//                     <button
//                         onClick={onBack}
//                         className="text-gray-400 font-medium text-sm"
//                         style={{ marginTop: -8 }}
//                     >
//                         ← Geri Dön
//                     </button>
//                 )}
//             </div>
//         </div>
//     );
// }

// // ─── Report modal ─────────────────────────────────────────────────────────────
// function ReportModal({ shoppingList, collected, elapsed, payMethod, onRestart, onHome }) {
//     const correctCount = shoppingList.filter(i => collected.includes(i.id)).length;
//     const total = shoppingList.length;
//     const stars = correctCount === 4 ? 3 : correctCount >= 2 ? 2 : 1;

//     return (
//         <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 200, background: "rgba(0,0,0,0.65)" }}>
//             <div
//                 className="rounded-3xl p-8 flex flex-col items-center gap-5"
//                 style={{ background: "white", width: "min(520px, 95vw)", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
//             >
//                 {/* Stars */}
//                 <div className="flex gap-1">
//                     {[1, 2, 3].map(n => (
//                         <span key={n} style={{ fontSize: 36, opacity: n <= stars ? 1 : 0.25 }}>⭐</span>
//                     ))}
//                 </div>

//                 <h2 className="text-2xl font-bold text-gray-800 text-center">Alışveriş Raporu</h2>

//                 {/* Score card */}
//                 <div
//                     className="w-full rounded-2xl p-5 flex justify-around"
//                     style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
//                 >
//                     <div className="text-center">
//                         <div style={{ fontSize: 32, fontWeight: 800, color: correctCount === total ? "#16a34a" : "#f59e0b" }}>
//                             {correctCount}/{total}
//                         </div>
//                         <div style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>Doğru Ürün</div>
//                     </div>
//                     <div style={{ width: 1, background: "#e2e8f0" }} />
//                     <div className="text-center">
//                         <div style={{ fontSize: 32, fontWeight: 800, color: "#2563eb" }}>{formatTime(elapsed)}</div>
//                         <div style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>Süre</div>
//                     </div>
//                     <div style={{ width: 1, background: "#e2e8f0" }} />
//                     <div className="text-center">
//                         <div style={{ fontSize: 32, fontWeight: 800, color: "#7c3aed" }}>
//                             {payMethod === "card" ? "💳" : "💵"}
//                         </div>
//                         <div style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>
//                             {payMethod === "card" ? "Kart" : "Nakit"}
//                         </div>
//                     </div>
//                 </div>

//                 {/* Item breakdown */}
//                 <div className="w-full rounded-2xl p-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
//                     {shoppingList.map(item => {
//                         const done = collected.includes(item.id);
//                         return (
//                             <div key={item.id} className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid #f1f5f9" }}>
//                                 <div className="flex items-center gap-2">
//                                     <span style={{ fontSize: 18 }}>{item.emoji}</span>
//                                     <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{item.name}</span>
//                                 </div>
//                                 <span
//                                     className="rounded-full px-3 py-0.5 text-xs font-bold"
//                                     style={{ background: done ? "#dcfce7" : "#fee2e2", color: done ? "#16a34a" : "#ef4444" }}
//                                 >
//                                     {done ? "✅ Alındı" : "❌ Alınmadı"}
//                                 </span>
//                             </div>
//                         );
//                     })}
//                 </div>

//                 {/* Message */}
//                 <p className="text-center font-semibold" style={{ color: "#475569", fontSize: 14 }}>
//                     {correctCount === 4
//                         ? "🎉 Mükemmel! Listedeki tüm ürünleri buldun!"
//                         : correctCount >= 2
//                             ? "👍 İyi iş! Biraz daha pratikle mükemmel olacaksın."
//                             : "💪 Devam et! Her alışveriş daha kolay olacak."}
//                 </p>

//                 {/* Buttons */}
//                 <div className="flex gap-3 w-full">
//                     <button
//                         onClick={onRestart}
//                         className="flex-1 py-3 rounded-2xl font-bold text-white"
//                         style={{ background: "#2563eb", fontSize: 15 }}
//                     >
//                         🔄 Tekrar Dene
//                     </button>
//                     <button
//                         onClick={onHome}
//                         className="flex-1 py-3 rounded-2xl font-bold text-white"
//                         style={{ background: "#475569", fontSize: 15 }}
//                     >
//                         🏠 Ana Sayfa
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }

// // ─── Overview (mall corridor) ─────────────────────────────────────────────────
// function OverviewScene({ onSelectSection, shoppingList, collected }) {
//     const [hovered, setHovered] = useState(null);
//     const navOrder = ["dairy", "fruits", "bakery", "kasa"];

//     return (
//         <div
//             className="absolute inset-0"
//             style={{
//                 backgroundImage: `url('${IMG.overview}')`,
//                 backgroundSize: "cover",
//                 backgroundPosition: "center top",
//             }}
//         >
//             <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.15)" }} />

//             {/* Nav buttons centred at top */}
//             <div
//                 className="absolute left-1/2 flex gap-3 flex-wrap justify-center"
//                 style={{ top: "6%", transform: "translateX(-50%)", zIndex: 10 }}
//             >
//                 {navOrder.map(sid => {
//                     const s = SECTION_META[sid];
//                     const itemsNeeded = shoppingList.filter(i => i.section === sid);
//                     const itemsDone = itemsNeeded.filter(i => collected.includes(i.id));
//                     const allDone = itemsNeeded.length > 0 && itemsDone.length === itemsNeeded.length;
//                     const isHov = hovered === sid;

//                     return (
//                         <button
//                             key={sid}
//                             onClick={() => onSelectSection(sid)}
//                             onMouseEnter={() => setHovered(sid)}
//                             onMouseLeave={() => setHovered(null)}
//                             className="flex flex-col items-center gap-1 rounded-2xl transition-all duration-200"
//                             style={{
//                                 minWidth: 105, padding: "10px 18px",
//                                 background: allDone
//                                     ? "rgba(22,163,74,0.93)"
//                                     : isHov ? s.hoverBg : "rgba(255,255,255,0.92)",
//                                 border: allDone ? "2px solid #16a34a" : isHov ? `2px solid ${s.color}` : "2px solid rgba(255,255,255,0.6)",
//                                 boxShadow: isHov ? "0 6px 24px rgba(0,0,0,0.25)" : "0 3px 12px rgba(0,0,0,0.18)",
//                                 transform: isHov ? "scale(1.07) translateY(-2px)" : "scale(1)",
//                                 backdropFilter: "blur(6px)",
//                             }}
//                         >
//                             <span style={{ fontSize: 26 }}>{s.emoji}</span>
//                             <span style={{ fontSize: 12, fontWeight: 700, color: allDone ? "white" : s.color, whiteSpace: "nowrap" }}>
//                                 {s.label}
//                             </span>
//                             {itemsNeeded.length > 0 && (
//                                 <span
//                                     className="rounded-full px-2"
//                                     style={{ fontSize: 10, fontWeight: 700, background: allDone ? "rgba(255,255,255,0.3)" : s.color, color: "white" }}
//                                 >
//                                     {itemsDone.length}/{itemsNeeded.length}{allDone ? " ✅" : ""}
//                                 </span>
//                             )}
//                         </button>
//                     );
//                 })}
//             </div>

//             <div
//                 className="absolute bottom-0 left-0 right-0 py-3 text-center"
//                 style={{ background: "rgba(0,0,0,0.48)" }}
//             >
//                 <p style={{ color: "rgba(255,255,255,0.88)", fontSize: 13, fontWeight: 600 }}>
//                     👆 Yukarıdaki butonlardan bir bölüme git ve ürünleri bul!
//                 </p>
//             </div>
//         </div>
//     );
// }

// // ─── Main component ───────────────────────────────────────────────────────────
// export default function MarketScenario({ onExit }) {
//     const initList = useCallback(() => generateShoppingList(), []);

//     const [shoppingList, setShoppingList] = useState(initList);
//     const [screen, setScreen] = useState("overview"); // overview | shelf | kasa | done
//     const [activeSection, setActiveSection] = useState(null);
//     const [collected, setCollected] = useState([]);
//     const [history, setHistory] = useState(["overview"]);
//     const [elapsed, setElapsed] = useState(0);
//     const [payMethod, setPayMethod] = useState(null);
//     const timerRef = useRef(null);

//     // Timer
//     useEffect(() => {
//         timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
//         return () => clearInterval(timerRef.current);
//     }, []);

//     function goTo(next, section = null) {
//         setHistory(h => [...h, next]);
//         setScreen(next);
//         if (section) setActiveSection(section);
//     }

//     function goBack() {
//         if (history.length <= 1) return;
//         const newHist = history.slice(0, -1);
//         const prev = newHist[newHist.length - 1];
//         setHistory(newHist);
//         setScreen(prev);
//         if (prev === "overview") setActiveSection(null);
//     }

//     function handlePick(product, isNeeded) {
//         if (isNeeded) setCollected(c => [...c, product.id]);
//     }

//     function handleFinish(method) {
//         clearInterval(timerRef.current);
//         setPayMethod(method);
//         setScreen("done");
//     }

//     function handleRestart() {
//         setShoppingList(generateShoppingList());
//         setCollected([]);
//         setScreen("overview");
//         setActiveSection(null);
//         setHistory(["overview"]);
//         setElapsed(0);
//         setPayMethod(null);
//         timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
//     }

//     const allDone = shoppingList.every(i => collected.includes(i.id));

//     return (
//         <div className="fixed inset-0 flex flex-col" style={{ zIndex: 100, background: "#000" }}>

//             {/* ── HUD ───────────────────────────────────────────────────────── */}
//             <div
//                 className="flex items-center justify-between px-5 py-3 gap-3 flex-shrink-0"
//                 style={{ background: "rgba(0,0,0,0.9)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
//             >
//                 {/* Shopping list */}
//                 <div className="flex items-center gap-3 flex-1 min-w-0">
//                     <span className="text-white font-bold text-sm flex-shrink-0 hidden sm:block">🛒 Liste:</span>
//                     <div className="flex gap-2 flex-wrap">
//                         {shoppingList.map(item => {
//                             const done = collected.includes(item.id);
//                             return (
//                                 <span
//                                     key={item.id}
//                                     className="rounded-full px-3 py-1 text-xs font-bold transition-all duration-300"
//                                     style={{
//                                         background: done ? "#22c55e" : "rgba(255,255,255,0.15)",
//                                         color: done ? "white" : "rgba(255,255,255,0.8)",
//                                         textDecoration: done ? "line-through" : "none",
//                                     }}
//                                 >
//                                     {done ? "✅ " : ""}{item.name}
//                                 </span>
//                             );
//                         })}
//                     </div>
//                 </div>

//                 {/* Timer + exit */}
//                 <div className="flex items-center gap-3 flex-shrink-0">
//                     <div
//                         className="rounded-full px-4 py-1.5 font-bold text-sm"
//                         style={{ background: "rgba(255,255,255,0.12)", color: "white" }}
//                     >
//                         ⏱ {formatTime(elapsed)}
//                     </div>
//                     {onExit && (
//                         <button
//                             onClick={onExit}
//                             className="rounded-full w-8 h-8 flex items-center justify-center font-bold text-white"
//                             style={{ background: "rgba(255,255,255,0.15)", fontSize: 16 }}
//                         >
//                             ✕
//                         </button>
//                     )}
//                 </div>
//             </div>

//             {/* ── Scene area ─────────────────────────────────────────────────── */}
//             <div className="flex-1 relative overflow-hidden">
//                 {screen === "overview" && (
//                     <OverviewScene
//                         onSelectSection={sid => { if (sid === "kasa") goTo("kasa"); else goTo("shelf", sid); }}
//                         shoppingList={shoppingList}
//                         collected={collected}
//                     />
//                 )}

//                 {screen === "shelf" && activeSection && (
//                     <ShelfScene
//                         sectionId={activeSection}
//                         shoppingList={shoppingList}
//                         collected={collected}
//                         onPick={handlePick}
//                         onBack={goBack}
//                     />
//                 )}

//                 {screen === "kasa" && (
//                     <KasaScene
//                         shoppingList={shoppingList}
//                         collected={collected}
//                         onBack={goBack}
//                         onFinish={handleFinish}
//                     />
//                 )}

//                 {/* "All done" nudge */}
//                 {allDone && screen === "overview" && (
//                     <div
//                         className="absolute bottom-0 left-0 right-0 py-3 text-center font-bold text-white"
//                         style={{ background: "#16a34a", zIndex: 20 }}
//                     >
//                         🎉 Tüm ürünleri aldın! Kasaya git ve alışverişi tamamla!
//                     </div>
//                 )}
//             </div>

//             {/* ── Report overlay ─────────────────────────────────────────────── */}
//             {screen === "done" && (
//                 <ReportModal
//                     shoppingList={shoppingList}
//                     collected={collected}
//                     elapsed={elapsed}
//                     payMethod={payMethod}
//                     onRestart={handleRestart}
//                     onHome={onExit}
//                 />
//             )}
//         </div>
//     );
// }







































// import { useState, useEffect, useRef, useCallback } from "react";
// import ScenarioAssistant from "./ScenarioAssistant";

// // ─── Asset imports (src/assets/ klasöründen) ─────────────────────────────────
// import imgOverview from "../assets/alisveris_merkezi.png";
// import imgFruits from "../assets/meyve_sebze.png";
// import imgBakery from "../assets/firin.png";
// import imgDairy from "../assets/sut_urunleri.png";
// import imgKasa from "../assets/kasa.png";

// const IMG = {
//     overview: imgOverview,
//     fruits: imgFruits,
//     bakery: imgBakery,
//     dairy: imgDairy,
//     kasa: imgKasa,
// };

// // ─── Full product pools ───────────────────────────────────────────────────────
// const BAKERY_POOL = [
//     { id: "simit", name: "Simit", },
//     { id: "pogaca", name: "Açma / Poğaça", },
//     { id: "kruvasan", name: "Kruvasan", },
//     { id: "donut", name: "Çikolatalı Donut", },
//     { id: "baget", name: "Baget Ekmek", },
//     { id: "tam_bugday", name: "Tam Buğday Ekmek", },
//     { id: "sandvic", name: "Sandviç Ekmeği", },
//     { id: "borek", name: "Börek Dilimleri", },
//     { id: "kurabiye", name: "Kurabiye", },
// ];

// const DAIRY_POOL = [
//     { id: "sut", name: "Süt", },
//     { id: "kasar", name: "Kaşar Peyniri", },
//     { id: "yogurt", name: "Yoğurt", },
//     { id: "beyaz_peynir", name: "Beyaz Peynir", },
//     { id: "labne", name: "Labne / Krem Peynir", },
//     { id: "tereyagi", name: "Tereyağı", },
//     { id: "rendelenmis", name: "Rendelenmiş Kaşar", },
// ];

// const FRUITS_POOL = [
//     { id: "elma", name: "Elma", },
//     { id: "armut", name: "Armut", },
//     { id: "muz", name: "Muz", },
//     { id: "domates", name: "Domates", },
//     { id: "havuc", name: "Havuç", },
//     { id: "biber", name: "Biber", },
//     { id: "lahana", name: "Lahana", },
//     { id: "ananas", name: "Ananas", },
//     { id: "portakal", name: "Portakal", },
// ];

// const SECTION_META = {
//     dairy: { id: "dairy", label: "Süt Ürünleri", color: "#2563eb", hoverBg: "#dbeafe" },
//     fruits: { id: "fruits", label: "Meyve & Sebze", color: "#16a34a", hoverBg: "#dcfce7" },
//     bakery: { id: "bakery", label: "Fırın", color: "#d97706", hoverBg: "#fef3c7" },
//     kasa: { id: "kasa", label: "Kasa", color: "#7c3aed", hoverBg: "#ede9fe" },
// };

// function pickRandom(arr, n) {
//     const shuffled = [...arr].sort(() => Math.random() - 0.5);
//     return shuffled.slice(0, n);
// }

// function generateShoppingList() {
//     const dairy = pickRandom(DAIRY_POOL, 1);
//     const fruits = pickRandom(FRUITS_POOL, 2);
//     const bakery = pickRandom(BAKERY_POOL, 1);
//     return [
//         ...dairy.map(p => ({ ...p, section: "dairy" })),
//         ...fruits.map(p => ({ ...p, section: "fruits" })),
//         ...bakery.map(p => ({ ...p, section: "bakery" })),
//     ];
// }

// function formatTime(seconds) {
//     const m = Math.floor(seconds / 60);
//     const s = seconds % 60;
//     return `${m}:${s.toString().padStart(2, "0")}`;
// }

// // ─── Shelf overlay scene ──────────────────────────────────────────────────────
// function ShelfScene({ sectionId, shoppingList, collected, onPick, onBack }) {
//     const [feedback, setFeedback] = useState(null);

//     const poolMap = { bakery: BAKERY_POOL, dairy: DAIRY_POOL, fruits: FRUITS_POOL };
//     const products = poolMap[sectionId] || [];
//     const neededIds = shoppingList.filter(i => i.section === sectionId).map(i => i.id);

//     function handlePick(product) {
//         if (collected.includes(product.id)) {
//             setFeedback({ type: "already", name: product.name });
//             setTimeout(() => setFeedback(null), 1800);
//             return;
//         }
//         const isNeeded = neededIds.includes(product.id);
//         onPick(product, isNeeded);
//         setFeedback({ type: isNeeded ? "correct" : "wrong", name: product.name });
//         setTimeout(() => setFeedback(null), 1800);
//     }

//     // Layout: 3 rows × 3 cols grid to mimic shelf positions
//     const rows = [products.slice(0, 3), products.slice(3, 6), products.slice(6, 9)];

//     return (
//         <div
//             className="absolute inset-0 flex flex-col"
//             style={{
//                 backgroundImage: `url('${IMG[sectionId]}')`,
//                 backgroundSize: "cover",
//                 backgroundPosition: "center",
//             }}
//         >
//             {/* Dark overlay for readability */}
//             <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.38)" }} />

//             {/* Product buttons grid — positioned over shelves */}
//             <div className="relative flex-1 flex flex-col justify-around px-6 py-4" style={{ zIndex: 2 }}>
//                 {rows.map((row, ri) => (
//                     <div key={ri} className="flex justify-around items-center gap-3">
//                         {row.map((product) => {
//                             const isCollected = collected.includes(product.id);
//                             const isNeeded = neededIds.includes(product.id);
//                             return (
//                                 <button
//                                     key={product.id}
//                                     onClick={() => handlePick(product)}
//                                     disabled={isCollected}
//                                     className="flex flex-col items-center gap-1 rounded-2xl transition-all duration-200"
//                                     style={{
//                                         width: 110, padding: "10px 8px",
//                                         background: isCollected
//                                             ? "rgba(34,197,94,0.85)"
//                                             : isNeeded
//                                                 ? "rgba(255,255,255,0.95)"
//                                                 : "rgba(255,255,255,0.82)",
//                                         border: isNeeded && !isCollected
//                                             ? "2.5px solid #f59e0b"
//                                             : "2px solid rgba(255,255,255,0.5)",
//                                         boxShadow: isCollected ? "none" : "0 4px 16px rgba(0,0,0,0.35)",
//                                         cursor: isCollected ? "default" : "pointer",
//                                         transform: "scale(1)",
//                                     }}
//                                     onMouseEnter={e => { if (!isCollected) e.currentTarget.style.transform = "scale(1.08) translateY(-4px)"; }}
//                                     onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
//                                 >
//                                     <span style={{ fontSize: 28 }}>{isCollected ? "✅" : product.emoji}</span>
//                                     <span style={{ fontSize: 11, fontWeight: 700, color: isCollected ? "white" : "#1e293b", textAlign: "center", lineHeight: 1.2 }}>
//                                         {product.name}
//                                     </span>
//                                 </button>
//                             );
//                         })}
//                     </div>
//                 ))}
//             </div>

//             {/* Feedback toast */}
//             {feedback && (
//                 <div
//                     className="absolute left-1/2 rounded-2xl px-6 py-4 font-bold text-white text-base text-center"
//                     style={{
//                         top: "50%", transform: "translateX(-50%) translateY(-50%)",
//                         background: feedback.type === "correct"
//                             ? "rgba(22,163,74,0.96)"
//                             : feedback.type === "wrong"
//                                 ? "rgba(220,38,38,0.96)"
//                                 : "rgba(80,80,80,0.95)",
//                         zIndex: 30, pointerEvents: "none", whiteSpace: "nowrap", minWidth: 280,
//                         boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
//                     }}
//                 >
//                     {feedback.type === "correct" && `✅ Harika! ${feedback.name} sepete eklendi!`}
//                     {feedback.type === "wrong" && `❌ ${feedback.name} listende değil!`}
//                     {feedback.type === "already" && `📦 ${feedback.name} zaten sepette!`}
//                 </div>
//             )}

//             {/* Back button */}
//             <div className="relative p-4 flex-shrink-0" style={{ zIndex: 2 }}>
//                 <button
//                     onClick={onBack}
//                     className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-white"
//                     style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.25)", fontSize: 15 }}
//                 >
//                     ← Geri Dön
//                 </button>
//             </div>
//         </div>
//     );
// }

// // ─── Kasa scene ───────────────────────────────────────────────────────────────
// function KasaScene({ shoppingList, collected, onBack, onFinish }) {
//     const [payMethod, setPayMethod] = useState(null);
//     const [confirmed, setConfirmed] = useState(false);

//     function handlePay(method) {
//         setPayMethod(method);
//         setTimeout(() => {
//             setConfirmed(true);
//             setTimeout(() => onFinish(method), 1200);
//         }, 600);
//     }

//     return (
//         <div
//             className="absolute inset-0 flex flex-col items-center justify-center"
//             style={{
//                 backgroundImage: `url('${IMG.kasa}')`,
//                 backgroundSize: "cover",
//                 backgroundPosition: "center",
//             }}
//         >
//             <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.52)" }} />

//             <div
//                 className="relative rounded-3xl p-7 flex flex-col items-center gap-5"
//                 style={{
//                     zIndex: 2, background: "rgba(255,255,255,0.97)",
//                     width: "min(480px, 92vw)", boxShadow: "0 12px 48px rgba(0,0,0,0.4)",
//                 }}
//             >
//                 <div style={{ fontSize: 48 }}>🧾</div>
//                 <h2 className="text-2xl font-bold text-gray-800">Ödeme Yöntemi Seç</h2>

//                 {/* Mini receipt */}
//                 <div className="w-full rounded-2xl p-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
//                     <p className="font-bold text-gray-700 text-sm mb-2 text-center">Sepetinizdeki Ürünler</p>
//                     {shoppingList.map(item => {
//                         const done = collected.includes(item.id);
//                         return (
//                             <div key={item.id} className="flex justify-between items-center py-1.5" style={{ borderBottom: "1px solid #f1f5f9" }}>
//                                 <span style={{ color: done ? "#16a34a" : "#ef4444", fontSize: 13, fontWeight: 600 }}>
//                                     {done ? "✅" : "❌"} {item.name}
//                                 </span>
//                                 <span style={{ color: done ? "#16a34a" : "#9ca3af", fontSize: 12 }}>{done ? "Alındı" : "Alınmadı"}</span>
//                             </div>
//                         );
//                     })}
//                 </div>

//                 {confirmed ? (
//                     <div className="flex flex-col items-center gap-2">
//                         <div style={{ fontSize: 48 }}>✅</div>
//                         <p className="font-bold text-green-600 text-lg">
//                             {payMethod === "card" ? "Kart ile ödendi!" : "Nakit ödeme alındı!"}
//                         </p>
//                     </div>
//                 ) : (
//                     <div className="flex gap-4 w-full">
//                         <button
//                             onClick={() => handlePay("card")}
//                             className="flex-1 flex flex-col items-center gap-2 rounded-2xl py-5 font-bold transition-all"
//                             style={{ background: "#2563eb", color: "white", fontSize: 15, boxShadow: "0 4px 16px rgba(37,99,235,0.4)" }}
//                             onMouseEnter={e => e.currentTarget.style.background = "#1d4ed8"}
//                             onMouseLeave={e => e.currentTarget.style.background = "#2563eb"}
//                         >
//                             <span style={{ fontSize: 32 }}>💳</span>
//                             Kredi / Banka Kartı
//                         </button>
//                         <button
//                             onClick={() => handlePay("cash")}
//                             className="flex-1 flex flex-col items-center gap-2 rounded-2xl py-5 font-bold transition-all"
//                             style={{ background: "#16a34a", color: "white", fontSize: 15, boxShadow: "0 4px 16px rgba(22,163,74,0.4)" }}
//                             onMouseEnter={e => e.currentTarget.style.background = "#15803d"}
//                             onMouseLeave={e => e.currentTarget.style.background = "#16a34a"}
//                         >
//                             <span style={{ fontSize: 32 }}>💵</span>
//                             Nakit
//                         </button>
//                     </div>
//                 )}

//                 {!confirmed && (
//                     <button
//                         onClick={onBack}
//                         className="text-gray-400 font-medium text-sm"
//                         style={{ marginTop: -8 }}
//                     >
//                         ← Geri Dön
//                     </button>
//                 )}
//             </div>
//         </div>
//     );
// }

// // ─── Report modal ─────────────────────────────────────────────────────────────
// function ReportModal({ shoppingList, collected, elapsed, payMethod, onRestart, onHome }) {
//     const correctCount = shoppingList.filter(i => collected.includes(i.id)).length;
//     const total = shoppingList.length;
//     const stars = correctCount === 4 ? 3 : correctCount >= 2 ? 2 : 1;

//     return (
//         <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 200, background: "rgba(0,0,0,0.65)" }}>
//             <div
//                 className="rounded-3xl p-8 flex flex-col items-center gap-5"
//                 style={{ background: "white", width: "min(520px, 95vw)", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
//             >
//                 {/* Stars */}
//                 <div className="flex gap-1">
//                     {[1, 2, 3].map(n => (
//                         <span key={n} style={{ fontSize: 36, opacity: n <= stars ? 1 : 0.25 }}>⭐</span>
//                     ))}
//                 </div>

//                 <h2 className="text-2xl font-bold text-gray-800 text-center">Alışveriş Raporu</h2>

//                 {/* Score card */}
//                 <div
//                     className="w-full rounded-2xl p-5 flex justify-around"
//                     style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
//                 >
//                     <div className="text-center">
//                         <div style={{ fontSize: 32, fontWeight: 800, color: correctCount === total ? "#16a34a" : "#f59e0b" }}>
//                             {correctCount}/{total}
//                         </div>
//                         <div style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>Doğru Ürün</div>
//                     </div>
//                     <div style={{ width: 1, background: "#e2e8f0" }} />
//                     <div className="text-center">
//                         <div style={{ fontSize: 32, fontWeight: 800, color: "#2563eb" }}>{formatTime(elapsed)}</div>
//                         <div style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>Süre</div>
//                     </div>
//                     <div style={{ width: 1, background: "#e2e8f0" }} />
//                     <div className="text-center">
//                         <div style={{ fontSize: 32, fontWeight: 800, color: "#7c3aed" }}>
//                             {payMethod === "card" ? "💳" : "💵"}
//                         </div>
//                         <div style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>
//                             {payMethod === "card" ? "Kart" : "Nakit"}
//                         </div>
//                     </div>
//                 </div>

//                 {/* Item breakdown */}
//                 <div className="w-full rounded-2xl p-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
//                     {shoppingList.map(item => {
//                         const done = collected.includes(item.id);
//                         return (
//                             <div key={item.id} className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid #f1f5f9" }}>
//                                 <div className="flex items-center gap-2">
//                                     <span style={{ fontSize: 18 }}>{item.emoji}</span>
//                                     <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{item.name}</span>
//                                 </div>
//                                 <span
//                                     className="rounded-full px-3 py-0.5 text-xs font-bold"
//                                     style={{ background: done ? "#dcfce7" : "#fee2e2", color: done ? "#16a34a" : "#ef4444" }}
//                                 >
//                                     {done ? "✅ Alındı" : "❌ Alınmadı"}
//                                 </span>
//                             </div>
//                         );
//                     })}
//                 </div>

//                 {/* Message */}
//                 <p className="text-center font-semibold" style={{ color: "#475569", fontSize: 14 }}>
//                     {correctCount === 4
//                         ? "🎉 Mükemmel! Listedeki tüm ürünleri buldun!"
//                         : correctCount >= 2
//                             ? "👍 İyi iş! Biraz daha pratikle mükemmel olacaksın."
//                             : "💪 Devam et! Her alışveriş daha kolay olacak."}
//                 </p>

//                 {/* Buttons */}
//                 <div className="flex gap-3 w-full">
//                     <button
//                         onClick={onRestart}
//                         className="flex-1 py-3 rounded-2xl font-bold text-white"
//                         style={{ background: "#2563eb", fontSize: 15 }}
//                     >
//                         🔄 Tekrar Dene
//                     </button>
//                     <button
//                         onClick={onHome}
//                         className="flex-1 py-3 rounded-2xl font-bold text-white"
//                         style={{ background: "#475569", fontSize: 15 }}
//                     >
//                         🏠 Ana Sayfa
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }

// // ─── Overview (mall corridor) ─────────────────────────────────────────────────
// function OverviewScene({ onSelectSection, shoppingList, collected }) {
//     const [hovered, setHovered] = useState(null);
//     const navOrder = ["dairy", "fruits", "bakery", "kasa"];

//     return (
//         <div
//             className="absolute inset-0"
//             style={{
//                 backgroundImage: `url('${IMG.overview}')`,
//                 backgroundSize: "cover",
//                 backgroundPosition: "center top",
//             }}
//         >
//             <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.15)" }} />

//             {/* Nav buttons centred at top */}
//             <div
//                 className="absolute left-1/2 flex gap-3 flex-wrap justify-center"
//                 style={{ top: "6%", transform: "translateX(-50%)", zIndex: 10 }}
//             >
//                 {navOrder.map(sid => {
//                     const s = SECTION_META[sid];
//                     const itemsNeeded = shoppingList.filter(i => i.section === sid);
//                     const itemsDone = itemsNeeded.filter(i => collected.includes(i.id));
//                     const allDone = itemsNeeded.length > 0 && itemsDone.length === itemsNeeded.length;
//                     const isHov = hovered === sid;

//                     return (
//                         <button
//                             key={sid}
//                             onClick={() => onSelectSection(sid)}
//                             onMouseEnter={() => setHovered(sid)}
//                             onMouseLeave={() => setHovered(null)}
//                             className="flex flex-col items-center gap-1 rounded-2xl transition-all duration-200"
//                             style={{
//                                 minWidth: 105, padding: "10px 18px",
//                                 background: allDone
//                                     ? "rgba(22,163,74,0.93)"
//                                     : isHov ? s.hoverBg : "rgba(255,255,255,0.92)",
//                                 border: allDone ? "2px solid #16a34a" : isHov ? `2px solid ${s.color}` : "2px solid rgba(255,255,255,0.6)",
//                                 boxShadow: isHov ? "0 6px 24px rgba(0,0,0,0.25)" : "0 3px 12px rgba(0,0,0,0.18)",
//                                 transform: isHov ? "scale(1.07) translateY(-2px)" : "scale(1)",
//                                 backdropFilter: "blur(6px)",
//                             }}
//                         >
//                             <span style={{ fontSize: 26 }}>{s.emoji}</span>
//                             <span style={{ fontSize: 12, fontWeight: 700, color: allDone ? "white" : s.color, whiteSpace: "nowrap" }}>
//                                 {s.label}
//                             </span>
//                             {itemsNeeded.length > 0 && (
//                                 <span
//                                     className="rounded-full px-2"
//                                     style={{ fontSize: 10, fontWeight: 700, background: allDone ? "rgba(255,255,255,0.3)" : s.color, color: "white" }}
//                                 >
//                                     {itemsDone.length}/{itemsNeeded.length}{allDone ? " ✅" : ""}
//                                 </span>
//                             )}
//                         </button>
//                     );
//                 })}
//             </div>

//             <div
//                 className="absolute bottom-0 left-0 right-0 py-3 text-center"
//                 style={{ background: "rgba(0,0,0,0.48)" }}
//             >
//                 <p style={{ color: "rgba(255,255,255,0.88)", fontSize: 13, fontWeight: 600 }}>
//                     👆 Yukarıdaki butonlardan bir bölüme git ve ürünleri bul!
//                 </p>
//             </div>
//         </div>
//     );
// }

// // ─── Main component ───────────────────────────────────────────────────────────
// export default function MarketScenario({ onExit }) {
//     const initList = useCallback(() => generateShoppingList(), []);

//     const [shoppingList, setShoppingList] = useState(initList);
//     const [screen, setScreen] = useState("overview"); // overview | shelf | kasa | done
//     const [activeSection, setActiveSection] = useState(null);
//     const [collected, setCollected] = useState([]);
//     const [history, setHistory] = useState(["overview"]);
//     const [elapsed, setElapsed] = useState(0);
//     const [payMethod, setPayMethod] = useState(null);
//     const timerRef = useRef(null);

//     // Timer
//     useEffect(() => {
//         timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
//         return () => clearInterval(timerRef.current);
//     }, []);

//     function goTo(next, section = null) {
//         setHistory(h => [...h, next]);
//         setScreen(next);
//         if (section) setActiveSection(section);
//     }

//     function goBack() {
//         if (history.length <= 1) return;
//         const newHist = history.slice(0, -1);
//         const prev = newHist[newHist.length - 1];
//         setHistory(newHist);
//         setScreen(prev);
//         if (prev === "overview") setActiveSection(null);
//     }

//     function handlePick(product, isNeeded) {
//         if (isNeeded) setCollected(c => [...c, product.id]);
//     }

//     function handleFinish(method) {
//         clearInterval(timerRef.current);
//         setPayMethod(method);
//         setScreen("done");
//     }

//     function handleRestart() {
//         setShoppingList(generateShoppingList());
//         setCollected([]);
//         setScreen("overview");
//         setActiveSection(null);
//         setHistory(["overview"]);
//         setElapsed(0);
//         setPayMethod(null);
//         timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
//     }

//     const allDone = shoppingList.every(i => collected.includes(i.id));

//     return (
//         <div className="fixed inset-0 flex flex-col" style={{ zIndex: 100, background: "#000" }}>

//             {/* ── HUD ───────────────────────────────────────────────────────── */}
//             <div
//                 className="flex items-center justify-between px-5 py-3 gap-3 flex-shrink-0"
//                 style={{ background: "rgba(0,0,0,0.9)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
//             >
//                 {/* Shopping list */}
//                 <div className="flex items-center gap-3 flex-1 min-w-0">
//                     <span className="text-white font-bold text-sm flex-shrink-0 hidden sm:block">🛒 Liste:</span>
//                     <div className="flex gap-2 flex-wrap">
//                         {shoppingList.map(item => {
//                             const done = collected.includes(item.id);
//                             return (
//                                 <span
//                                     key={item.id}
//                                     className="rounded-full px-3 py-1 text-xs font-bold transition-all duration-300"
//                                     style={{
//                                         background: done ? "#22c55e" : "rgba(255,255,255,0.15)",
//                                         color: done ? "white" : "rgba(255,255,255,0.8)",
//                                         textDecoration: done ? "line-through" : "none",
//                                     }}
//                                 >
//                                     {done ? "✅ " : ""}{item.name}
//                                 </span>
//                             );
//                         })}
//                     </div>
//                 </div>

//                 {/* Timer + exit */}
//                 <div className="flex items-center gap-3 flex-shrink-0">
//                     <div
//                         className="rounded-full px-4 py-1.5 font-bold text-sm"
//                         style={{ background: "rgba(255,255,255,0.12)", color: "white" }}
//                     >
//                         ⏱ {formatTime(elapsed)}
//                     </div>
//                     {onExit && (
//                         <button
//                             onClick={onExit}
//                             className="rounded-full w-8 h-8 flex items-center justify-center font-bold text-white"
//                             style={{ background: "rgba(255,255,255,0.15)", fontSize: 16 }}
//                         >
//                             ✕
//                         </button>
//                     )}
//                 </div>
//             </div>

//             {/* ── Scene area ─────────────────────────────────────────────────── */}
//             <div className="flex-1 relative overflow-hidden">
//                 {screen === "overview" && (
//                     <OverviewScene
//                         onSelectSection={sid => { if (sid === "kasa") goTo("kasa"); else goTo("shelf", sid); }}
//                         shoppingList={shoppingList}
//                         collected={collected}
//                     />
//                 )}

//                 {screen === "shelf" && activeSection && (
//                     <ShelfScene
//                         sectionId={activeSection}
//                         shoppingList={shoppingList}
//                         collected={collected}
//                         onPick={handlePick}
//                         onBack={goBack}
//                     />
//                 )}

//                 {screen === "kasa" && (
//                     <KasaScene
//                         shoppingList={shoppingList}
//                         collected={collected}
//                         onBack={goBack}
//                         onFinish={handleFinish}
//                     />
//                 )}

//                 {/* "All done" nudge */}
//                 {allDone && screen === "overview" && (
//                     <div
//                         className="absolute bottom-0 left-0 right-0 py-3 text-center font-bold text-white"
//                         style={{ background: "#16a34a", zIndex: 20 }}
//                     >
//                         🎉 Tüm ürünleri aldın! Kasaya git ve alışverişi tamamla!
//                     </div>
//                 )}
//             </div>

//             {/* ── Report overlay ─────────────────────────────────────────────── */}
//             {screen === "done" && (
//                 <ReportModal
//                     shoppingList={shoppingList}
//                     collected={collected}
//                     elapsed={elapsed}
//                     payMethod={payMethod}
//                     onRestart={handleRestart}
//                     onHome={onExit}
//                 />
//             )}

//             {/* ── Scenario Assistant ─────────────────────────────────────────── */}
//             {screen !== "done" && (
//                 <ScenarioAssistant
//                     screen={screen}
//                     shoppingList={shoppingList}
//                     collected={collected}
//                     activeSection={activeSection}
//                 />
//             )}
//         </div>
//     );
// }






























































import { useState, useEffect, useRef, useCallback } from "react";
import ScenarioAssistant from "./ScenarioAssistant";
import FocusTracker from "../components/FocusTracker";
// ─── Asset imports (src/assets/ klasöründen) ─────────────────────────────────
import imgOverview from "../assets/alisveris_merkezi.png";
import imgFruits   from "../assets/meyve_sebze.png";
import imgBakery   from "../assets/firin.png";
import imgDairy    from "../assets/sut_urunleri.png";
import imgKasa     from "../assets/kasa.png";

const IMG = {
  overview: imgOverview,
  fruits:   imgFruits,
  bakery:   imgBakery,
  dairy:    imgDairy,
  kasa:     imgKasa,
};

// ─── Full product pools ───────────────────────────────────────────────────────
const BAKERY_POOL = [
  { id: "simit",        name: "Simit",                  emoji: "🥯" },
  { id: "pogaca",       name: "Açma / Poğaça",          emoji: "🥐" },
  { id: "kruvasan",     name: "Kruvasan",               emoji: "🥐" },
  { id: "donut",        name: "Çikolatalı Donut",       emoji: "🍩" },
  { id: "baget",        name: "Baget Ekmek",            emoji: "🥖" },
  { id: "tam_bugday",   name: "Tam Buğday Ekmek",       emoji: "🍞" },
  { id: "sandvic",      name: "Sandviç Ekmeği",         emoji: "🍞" },
  { id: "borek",        name: "Börek Dilimleri",        emoji: "🥙" },
  { id: "kurabiye",     name: "Kurabiye",               emoji: "🍪" },
];

const DAIRY_POOL = [
  { id: "sut",          name: "Süt",                    emoji: "🥛" },
  { id: "kasar",        name: "Kaşar Peyniri",          emoji: "🧀" },
  { id: "yogurt",       name: "Yoğurt",                 emoji: "🫙" },
  { id: "beyaz_peynir", name: "Beyaz Peynir",           emoji: "🧀" },
  { id: "labne",        name: "Labne / Krem Peynir",    emoji: "🥛" },
  { id: "tereyagi",     name: "Tereyağı",               emoji: "🧈" },
  { id: "rendelenmis",  name: "Rendelenmiş Kaşar",      emoji: "🧀" },
];

const FRUITS_POOL = [
  { id: "elma",         name: "Elma",                   emoji: "🍎" },
  { id: "armut",        name: "Armut",                  emoji: "🍐" },
  { id: "muz",          name: "Muz",                    emoji: "🍌" },
  { id: "domates",      name: "Domates",                emoji: "🍅" },
  { id: "havuc",        name: "Havuç",                  emoji: "🥕" },
  { id: "biber",        name: "Biber",                  emoji: "🫑" },
  { id: "lahana",       name: "Lahana",                 emoji: "🥬" },
  { id: "ananas",       name: "Ananas",                 emoji: "🍍" },
  { id: "portakal",     name: "Portakal",               emoji: "🍊" },
];

const SECTION_META = {
  dairy:  { id: "dairy",  label: "Süt Ürünleri",   emoji: "🥛", color: "#2563eb", hoverBg: "#dbeafe" },
  fruits: { id: "fruits", label: "Meyve & Sebze",  emoji: "🍎", color: "#16a34a", hoverBg: "#dcfce7" },
  bakery: { id: "bakery", label: "Fırın",           emoji: "🥖", color: "#d97706", hoverBg: "#fef3c7" },
  kasa:   { id: "kasa",   label: "Kasa",            emoji: "🧾", color: "#7c3aed", hoverBg: "#ede9fe" },
};

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function generateShoppingList() {
  const dairy  = pickRandom(DAIRY_POOL,  1);
  const fruits = pickRandom(FRUITS_POOL, 2);
  const bakery = pickRandom(BAKERY_POOL, 1);
  return [
    ...dairy.map(p  => ({ ...p, section: "dairy"  })),
    ...fruits.map(p => ({ ...p, section: "fruits" })),
    ...bakery.map(p => ({ ...p, section: "bakery" })),
  ];
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Shelf overlay scene ──────────────────────────────────────────────────────
function ShelfScene({ sectionId, shoppingList, collected, onPick, onBack }) {
  const [feedback, setFeedback] = useState(null);

  const poolMap = { bakery: BAKERY_POOL, dairy: DAIRY_POOL, fruits: FRUITS_POOL };
  const products = poolMap[sectionId] || [];
  const neededIds = shoppingList.filter(i => i.section === sectionId).map(i => i.id);

  function handlePick(product) {
    if (collected.includes(product.id)) {
      setFeedback({ type: "already", name: product.name });
      setTimeout(() => setFeedback(null), 1800);
      return;
    }
    const isNeeded = neededIds.includes(product.id);
    onPick(product, isNeeded);
    setFeedback({ type: isNeeded ? "correct" : "wrong", name: product.name });
    setTimeout(() => setFeedback(null), 1800);
  }

  // Layout: 3 rows × 3 cols grid to mimic shelf positions
  const rows = [products.slice(0, 3), products.slice(3, 6), products.slice(6, 9)];

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{
        backgroundImage: `url('${IMG[sectionId]}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.38)" }} />

      {/* Product buttons grid — positioned over shelves */}
      <div className="relative flex-1 flex flex-col justify-around px-6 py-4" style={{ zIndex: 2 }}>
        {rows.map((row, ri) => (
          <div key={ri} className="flex justify-around items-center gap-3">
            {row.map((product) => {
              const isCollected = collected.includes(product.id);
              const isNeeded    = neededIds.includes(product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => handlePick(product)}
                  disabled={isCollected}
                  className="flex flex-col items-center gap-1 rounded-2xl transition-all duration-200"
                  style={{
                    width: 110, padding: "10px 8px",
                    background: isCollected
                      ? "rgba(34,197,94,0.85)"
                      : isNeeded
                      ? "rgba(255,255,255,0.95)"
                      : "rgba(255,255,255,0.82)",
                    border: isNeeded && !isCollected
                      ? "2.5px solid #f59e0b"
                      : "2px solid rgba(255,255,255,0.5)",
                    boxShadow: isCollected ? "none" : "0 4px 16px rgba(0,0,0,0.35)",
                    cursor: isCollected ? "default" : "pointer",
                    transform: "scale(1)",
                  }}
                  onMouseEnter={e => { if (!isCollected) e.currentTarget.style.transform = "scale(1.08) translateY(-4px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  <span style={{ fontSize: 28 }}>{isCollected ? "✅" : product.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isCollected ? "white" : "#1e293b", textAlign: "center", lineHeight: 1.2 }}>
                    {product.name}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div
          className="absolute left-1/2 rounded-2xl px-6 py-4 font-bold text-white text-base text-center"
          style={{
            top: "50%", transform: "translateX(-50%) translateY(-50%)",
            background: feedback.type === "correct"
              ? "rgba(22,163,74,0.96)"
              : feedback.type === "wrong"
              ? "rgba(220,38,38,0.96)"
              : "rgba(80,80,80,0.95)",
            zIndex: 30, pointerEvents: "none", whiteSpace: "nowrap", minWidth: 280,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {feedback.type === "correct" && `✅ Harika! ${feedback.name} sepete eklendi!`}
          {feedback.type === "wrong"   && `❌ ${feedback.name} listende değil!`}
          {feedback.type === "already" && `📦 ${feedback.name} zaten sepette!`}
        </div>
      )}

      {/* Back button */}
      <div className="relative p-4 flex-shrink-0" style={{ zIndex: 2 }}>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-white"
          style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.25)", fontSize: 15 }}
        >
          ← Geri Dön
        </button>
      </div>
    </div>
  );
}

// ─── Kasa scene ───────────────────────────────────────────────────────────────
function KasaScene({ shoppingList, collected, onBack, onFinish }) {
  const [payMethod, setPayMethod] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  function handlePay(method) {
    setPayMethod(method);
    setTimeout(() => {
      setConfirmed(true);
      setTimeout(() => onFinish(method), 1200);
    }, 600);
  }

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{
        backgroundImage: `url('${IMG.kasa}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.52)" }} />

      <div
        className="relative rounded-3xl p-7 flex flex-col items-center gap-5"
        style={{
          zIndex: 2, background: "rgba(255,255,255,0.97)",
          width: "min(480px, 92vw)", boxShadow: "0 12px 48px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ fontSize: 48 }}>🧾</div>
        <h2 className="text-2xl font-bold text-gray-800">Ödeme Yöntemi Seç</h2>

        {/* Mini receipt */}
        <div className="w-full rounded-2xl p-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <p className="font-bold text-gray-700 text-sm mb-2 text-center">Sepetinizdeki Ürünler</p>
          {shoppingList.map(item => {
            const done = collected.includes(item.id);
            return (
              <div key={item.id} className="flex justify-between items-center py-1.5" style={{ borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: done ? "#16a34a" : "#ef4444", fontSize: 13, fontWeight: 600 }}>
                  {done ? "✅" : "❌"} {item.name}
                </span>
                <span style={{ color: done ? "#16a34a" : "#9ca3af", fontSize: 12 }}>{done ? "Alındı" : "Alınmadı"}</span>
              </div>
            );
          })}
        </div>

        {confirmed ? (
          <div className="flex flex-col items-center gap-2">
            <div style={{ fontSize: 48 }}>✅</div>
            <p className="font-bold text-green-600 text-lg">
              {payMethod === "card" ? "Kart ile ödendi!" : "Nakit ödeme alındı!"}
            </p>
          </div>
        ) : (
          <div className="flex gap-4 w-full">
            <button
              onClick={() => handlePay("card")}
              className="flex-1 flex flex-col items-center gap-2 rounded-2xl py-5 font-bold transition-all"
              style={{ background: "#2563eb", color: "white", fontSize: 15, boxShadow: "0 4px 16px rgba(37,99,235,0.4)" }}
              onMouseEnter={e => e.currentTarget.style.background = "#1d4ed8"}
              onMouseLeave={e => e.currentTarget.style.background = "#2563eb"}
            >
              <span style={{ fontSize: 32 }}>💳</span>
              Kredi / Banka Kartı
            </button>
            <button
              onClick={() => handlePay("cash")}
              className="flex-1 flex flex-col items-center gap-2 rounded-2xl py-5 font-bold transition-all"
              style={{ background: "#16a34a", color: "white", fontSize: 15, boxShadow: "0 4px 16px rgba(22,163,74,0.4)" }}
              onMouseEnter={e => e.currentTarget.style.background = "#15803d"}
              onMouseLeave={e => e.currentTarget.style.background = "#16a34a"}
            >
              <span style={{ fontSize: 32 }}>💵</span>
              Nakit
            </button>
          </div>
        )}

        {!confirmed && (
          <button
            onClick={onBack}
            className="text-gray-400 font-medium text-sm"
            style={{ marginTop: -8 }}
          >
            ← Geri Dön
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Report modal ─────────────────────────────────────────────────────────────
function ReportModal({ shoppingList, collected, elapsed, payMethod, onRestart, onHome }) {
  const correctCount = shoppingList.filter(i => collected.includes(i.id)).length;
  const total = shoppingList.length;
  const stars = correctCount === 4 ? 3 : correctCount >= 2 ? 2 : 1;

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 200, background: "rgba(0,0,0,0.65)" }}>
      <div
        className="rounded-3xl p-8 flex flex-col items-center gap-5"
        style={{ background: "white", width: "min(520px, 95vw)", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
      >
        {/* Stars */}
        <div className="flex gap-1">
          {[1,2,3].map(n => (
            <span key={n} style={{ fontSize: 36, opacity: n <= stars ? 1 : 0.25 }}>⭐</span>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-gray-800 text-center">Alışveriş Raporu</h2>

        {/* Score card */}
        <div
          className="w-full rounded-2xl p-5 flex justify-around"
          style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
        >
          <div className="text-center">
            <div style={{ fontSize: 32, fontWeight: 800, color: correctCount === total ? "#16a34a" : "#f59e0b" }}>
              {correctCount}/{total}
            </div>
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>Doğru Ürün</div>
          </div>
          <div style={{ width: 1, background: "#e2e8f0" }} />
          <div className="text-center">
            <div style={{ fontSize: 32, fontWeight: 800, color: "#2563eb" }}>{formatTime(elapsed)}</div>
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>Süre</div>
          </div>
          <div style={{ width: 1, background: "#e2e8f0" }} />
          <div className="text-center">
            <div style={{ fontSize: 32, fontWeight: 800, color: "#7c3aed" }}>
              {payMethod === "card" ? "💳" : "💵"}
            </div>
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>
              {payMethod === "card" ? "Kart" : "Nakit"}
            </div>
          </div>
        </div>

        {/* Item breakdown */}
        <div className="w-full rounded-2xl p-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          {shoppingList.map(item => {
            const done = collected.includes(item.id);
            return (
              <div key={item.id} className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid #f1f5f9" }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 18 }}>{item.emoji}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{item.name}</span>
                </div>
                <span
                  className="rounded-full px-3 py-0.5 text-xs font-bold"
                  style={{ background: done ? "#dcfce7" : "#fee2e2", color: done ? "#16a34a" : "#ef4444" }}
                >
                  {done ? "✅ Alındı" : "❌ Alınmadı"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Message */}
        <p className="text-center font-semibold" style={{ color: "#475569", fontSize: 14 }}>
          {correctCount === 4
            ? "🎉 Mükemmel! Listedeki tüm ürünleri buldun!"
            : correctCount >= 2
            ? "👍 İyi iş! Biraz daha pratikle mükemmel olacaksın."
            : "💪 Devam et! Her alışveriş daha kolay olacak."}
        </p>

        {/* Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onRestart}
            className="flex-1 py-3 rounded-2xl font-bold text-white"
            style={{ background: "#2563eb", fontSize: 15 }}
          >
            🔄 Tekrar Dene
          </button>
          <button
            onClick={onHome}
            className="flex-1 py-3 rounded-2xl font-bold text-white"
            style={{ background: "#475569", fontSize: 15 }}
          >
            🏠 Ana Sayfa
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Overview (mall corridor) ─────────────────────────────────────────────────
function OverviewScene({ onSelectSection, shoppingList, collected }) {
  const [hovered, setHovered] = useState(null);
  const navOrder = ["dairy", "fruits", "bakery", "kasa"];

  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `url('${IMG.overview}')`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.15)" }} />

      {/* Nav buttons centred at top */}
      <div
        className="absolute left-1/2 flex gap-3 flex-wrap justify-center"
        style={{ top: "6%", transform: "translateX(-50%)", zIndex: 10 }}
      >
        {navOrder.map(sid => {
          const s = SECTION_META[sid];
          const itemsNeeded = shoppingList.filter(i => i.section === sid);
          const itemsDone   = itemsNeeded.filter(i => collected.includes(i.id));
          const allDone     = itemsNeeded.length > 0 && itemsDone.length === itemsNeeded.length;
          const isHov       = hovered === sid;

          return (
            <button
              key={sid}
              onClick={() => onSelectSection(sid)}
              onMouseEnter={() => setHovered(sid)}
              onMouseLeave={() => setHovered(null)}
              className="flex flex-col items-center gap-1 rounded-2xl transition-all duration-200"
              style={{
                minWidth: 105, padding: "10px 18px",
                background: allDone
                  ? "rgba(22,163,74,0.93)"
                  : isHov ? s.hoverBg : "rgba(255,255,255,0.92)",
                border: allDone ? "2px solid #16a34a" : isHov ? `2px solid ${s.color}` : "2px solid rgba(255,255,255,0.6)",
                boxShadow: isHov ? "0 6px 24px rgba(0,0,0,0.25)" : "0 3px 12px rgba(0,0,0,0.18)",
                transform: isHov ? "scale(1.07) translateY(-2px)" : "scale(1)",
                backdropFilter: "blur(6px)",
              }}
            >
              <span style={{ fontSize: 26 }}>{s.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: allDone ? "white" : s.color, whiteSpace: "nowrap" }}>
                {s.label}
              </span>
              {itemsNeeded.length > 0 && (
                <span
                  className="rounded-full px-2"
                  style={{ fontSize: 10, fontWeight: 700, background: allDone ? "rgba(255,255,255,0.3)" : s.color, color: "white" }}
                >
                  {itemsDone.length}/{itemsNeeded.length}{allDone ? " ✅" : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 py-3 text-center"
        style={{ background: "rgba(0,0,0,0.48)" }}
      >
        <p style={{ color: "rgba(255,255,255,0.88)", fontSize: 13, fontWeight: 600 }}>
          👆 Yukarıdaki butonlardan bir bölüme git ve ürünleri bul!
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MarketScenario({ onExit }) {
  const initList = useCallback(() => generateShoppingList(), []);

  const [shoppingList, setShoppingList] = useState(initList);
  const [screen,       setScreen]       = useState("overview"); // overview | shelf | kasa | done
  const [activeSection,setActiveSection]= useState(null);
  const [collected,    setCollected]    = useState([]);
  const [history,      setHistory]      = useState(["overview"]);
  const [elapsed,      setElapsed]      = useState(0);
  const [payMethod,    setPayMethod]    = useState(null);
  const [focusState,   setFocusState]   = useState("focused");
  const timerRef = useRef(null);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  function goTo(next, section = null) {
    setHistory(h => [...h, next]);
    setScreen(next);
    if (section) setActiveSection(section);
  }

  function goBack() {
    if (history.length <= 1) return;
    const newHist = history.slice(0, -1);
    const prev    = newHist[newHist.length - 1];
    setHistory(newHist);
    setScreen(prev);
    if (prev === "overview") setActiveSection(null);
  }

  function handlePick(product, isNeeded) {
    if (isNeeded) setCollected(c => [...c, product.id]);
  }

  function handleFinish(method) {
    clearInterval(timerRef.current);
    setPayMethod(method);
    setScreen("done");
  }

  function handleRestart() {
    setShoppingList(generateShoppingList());
    setCollected([]);
    setScreen("overview");
    setActiveSection(null);
    setHistory(["overview"]);
    setElapsed(0);
    setPayMethod(null);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }

  const allDone = shoppingList.every(i => collected.includes(i.id));

  return (
    <div className="fixed inset-0 flex flex-col" style={{ zIndex: 100, background: "#000" }}>

      {/* ── HUD ───────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 py-3 gap-3 flex-shrink-0"
        style={{ background: "rgba(0,0,0,0.9)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* Shopping list */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-white font-bold text-sm flex-shrink-0 hidden sm:block">🛒 Liste:</span>
          <div className="flex gap-2 flex-wrap">
            {shoppingList.map(item => {
              const done = collected.includes(item.id);
              return (
                <span
                  key={item.id}
                  className="rounded-full px-3 py-1 text-xs font-bold transition-all duration-300"
                  style={{
                    background: done ? "#22c55e" : "rgba(255,255,255,0.15)",
                    color: done ? "white" : "rgba(255,255,255,0.8)",
                    textDecoration: done ? "line-through" : "none",
                  }}
                >
                  {done ? "✅ " : ""}{item.name}
                </span>
              );
            })}
          </div>
        </div>

        {/* Timer + exit */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div
            className="rounded-full px-4 py-1.5 font-bold text-sm"
            style={{ background: "rgba(255,255,255,0.12)", color: "white" }}
          >
            ⏱ {formatTime(elapsed)}
          </div>
          {onExit && (
            <button
              onClick={onExit}
              className="rounded-full w-8 h-8 flex items-center justify-center font-bold text-white"
              style={{ background: "rgba(255,255,255,0.15)", fontSize: 16 }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Scene area ─────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {screen === "overview" && (
          <OverviewScene
            onSelectSection={sid => { if (sid === "kasa") goTo("kasa"); else goTo("shelf", sid); }}
            shoppingList={shoppingList}
            collected={collected}
          />
        )}

        {screen === "shelf" && activeSection && (
          <ShelfScene
            sectionId={activeSection}
            shoppingList={shoppingList}
            collected={collected}
            onPick={handlePick}
            onBack={goBack}
          />
        )}

        {screen === "kasa" && (
          <KasaScene
            shoppingList={shoppingList}
            collected={collected}
            onBack={goBack}
            onFinish={handleFinish}
          />
        )}

        {/* "All done" nudge */}
        {allDone && screen === "overview" && (
          <div
            className="absolute bottom-0 left-0 right-0 py-3 text-center font-bold text-white"
            style={{ background: "#16a34a", zIndex: 20 }}
          >
            🎉 Tüm ürünleri aldın! Kasaya git ve alışverişi tamamla!
          </div>
        )}
      </div>

      {/* ── Report overlay ─────────────────────────────────────────────── */}
      {screen === "done" && (
        <ReportModal
          shoppingList={shoppingList}
          collected={collected}
          elapsed={elapsed}
          payMethod={payMethod}
          onRestart={handleRestart}
          onHome={onExit}
        />
      )}

      {/* ── Focus Tracker ────────────────────────────────────────────── */}
      {screen !== "done" && (
        <FocusTracker onFocusChange={setFocusState} />
      )}

      {/* ── Scenario Assistant ─────────────────────────────────────────── */}
      {screen !== "done" && (
        <ScenarioAssistant
          screen={screen}
          shoppingList={shoppingList}
          collected={collected}
          activeSection={activeSection}
        />
      )}
    </div>
  );
}