
// import { useEffect, useRef, useState, useCallback } from "react";

// // ════════════════════════════════════════════════════════════════════
// //  MEDIAPIPE LOADER  —  sıralı yükle, her biri hazır olana bekle
// // ════════════════════════════════════════════════════════════════════
// const SCRIPTS = [
//   "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js",
//   "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3/drawing_utils.js",
//   "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh.js",
// ];

// function loadScript(src) {
//   return new Promise((resolve, reject) => {
//     // Zaten yüklüyse geç
//     if (document.querySelector(`script[src="${src}"]`)) {
//       resolve();
//       return;
//     }
//     const el = document.createElement("script");
//     el.src = src;
//     el.async = false; // sıralı çalışsın
//     el.onload  = () => resolve();
//     el.onerror = () => reject(new Error(`Script yüklenemedi: ${src}`));
//     document.head.appendChild(el);
//   });
// }

// async function loadAllScripts() {
//   for (const src of SCRIPTS) {
//     await loadScript(src);
//   }
// }

// // window.FaceMesh WASM init bitene kadar bekle
// function waitForFaceMesh(timeout = 10000) {
//   return new Promise((resolve, reject) => {
//     const start = Date.now();
//     const check = () => {
//       if (typeof window.FaceMesh === "function") {
//         resolve(window.FaceMesh);
//         return;
//       }
//       if (Date.now() - start > timeout) {
//         reject(new Error("FaceMesh timeout: window.FaceMesh hiç hazır olmadı"));
//         return;
//       }
//       setTimeout(check, 100);
//     };
//     check();
//   });
// }

// // ════════════════════════════════════════════════════════════════════
// //  LANDMARK SABİTLERİ
// // ════════════════════════════════════════════════════════════════════
// const LEFT_EYE   = [362, 385, 387, 263, 373, 380];
// const RIGHT_EYE  = [33,  160, 158, 133, 153, 144];
// const NOSE_TIP   = 1;
// const CHIN       = 152;
// const LEFT_TEMP  = 234;
// const RIGHT_TEMP = 454;
// const FOREHEAD   = 10;

// // ════════════════════════════════════════════════════════════════════
// //  GEOMETRİK YARDIMCILAR
// // ════════════════════════════════════════════════════════════════════
// const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

// function eyeAspectRatio(lm, idx) {
//   const [p1, p2, p3, p4, p5, p6] = idx.map(i => lm[i]);
//   return (dist(p2, p6) + dist(p3, p5)) / (2 * dist(p1, p4));
// }

// function headAngles(lm) {
//   const nose  = lm[NOSE_TIP];
//   const leftT = lm[LEFT_TEMP];
//   const rightT= lm[RIGHT_TEMP];
//   const fore  = lm[FOREHEAD];
//   const chin  = lm[CHIN];

//   const totalW = dist(leftT, rightT) || 0.001;
//   const yaw    = ((dist(leftT, nose) / totalW) - 0.5) * 200;
//   const noseY  = (nose.y - fore.y) / ((chin.y - fore.y) || 0.001);
//   const pitch  = (noseY - 0.42) * 250;
//   return { yaw, pitch };
// }

// // ════════════════════════════════════════════════════════════════════
// //  ODAK SABİTLERİ
// // ════════════════════════════════════════════════════════════════════
// const EAR_THRESH    = 0.20;
// const EAR_FRAMES    = 15;
// const YAW_THRESH    = 28;
// const PITCH_THRESH  = 28;
// const NO_FACE_FR    = 30;

// const STATES = {
//   focused:      { label: "Odaklı",          color: "#22c55e", icon: "🟢" },
//   eyes_closed:  { label: "Gözler Kapalı",   color: "#f59e0b", icon: "😑" },
//   looking_away: { label: "Dikkati Dağıldı", color: "#ef4444", icon: "👀" },
//   head_turned:  { label: "Kafa Döndü",      color: "#ef4444", icon: "↩️"  },
//   no_face:      { label: "Yüz Bulunamadı",  color: "#94a3b8", icon: "❓" },
//   loading:      { label: "Yükleniyor...",   color: "#94a3b8", icon: "⏳" },
//   error:        { label: "Hata",            color: "#dc2626", icon: "⚠️" },
// };

// // ════════════════════════════════════════════════════════════════════
// //  CANVAS ÇİZİCİ
// // ════════════════════════════════════════════════════════════════════
// function drawOverlay(ctx, lm, color, w, h) {
//   ctx.clearRect(0, 0, w, h);
//   if (!lm) return;

//   // Göz konturları
//   for (const idx of [LEFT_EYE, RIGHT_EYE]) {
//     ctx.beginPath();
//     idx.forEach((id, i) => {
//       const p = lm[id];
//       i === 0 ? ctx.moveTo(p.x * w, p.y * h) : ctx.lineTo(p.x * w, p.y * h);
//     });
//     ctx.closePath();
//     ctx.strokeStyle = color;
//     ctx.lineWidth = 1.5;
//     ctx.stroke();
//   }

//   // Burun noktası
//   const n = lm[NOSE_TIP];
//   ctx.beginPath();
//   ctx.arc(n.x * w, n.y * h, 3, 0, Math.PI * 2);
//   ctx.fillStyle = color;
//   ctx.fill();

//   // Baş yönü oku
//   const { yaw, pitch } = headAngles(lm);
//   const cx = n.x * w, cy = n.y * h;
//   const dx = Math.sin((yaw   / 100) * (Math.PI / 2)) * 22;
//   const dy = Math.sin((pitch / 100) * (Math.PI / 2)) * 22;
//   ctx.beginPath();
//   ctx.moveTo(cx, cy);
//   ctx.lineTo(cx + dx, cy + dy);
//   ctx.strokeStyle = color;
//   ctx.lineWidth = 2;
//   ctx.stroke();
//   ctx.beginPath();
//   ctx.arc(cx + dx, cy + dy, 3, 0, Math.PI * 2);
//   ctx.fillStyle = color;
//   ctx.fill();
// }

// // ════════════════════════════════════════════════════════════════════
// //  ANA BİLEŞEN
// // ════════════════════════════════════════════════════════════════════
// export default function FocusTracker({ onFocusChange }) {
//   const videoRef   = useRef(null);
//   const overlayRef = useRef(null);
//   const faceMeshRef= useRef(null);
//   const cameraRef  = useRef(null);

//   const [focusState,  setFocusState]  = useState("loading");
//   const [metrics,     setMetrics]     = useState({ yaw: 0, pitch: 0, earL: "—", earR: "—" });
//   const [initialized, setInitialized] = useState(false);
//   const [errorMsg,    setErrorMsg]    = useState("");
//   const [isMinimized, setIsMinimized] = useState(false);
//   const [enabled,     setEnabled]     = useState(true);
//   const [alert,       setAlert]       = useState({ show: false, msg: "" });

//   const eyeClosedCnt = useRef(0);
//   const noFaceCnt    = useRef(0);
//   const prevStateRef = useRef("loading");
//   const alertTimer   = useRef(null);

//   // ── Uyarı toast ──────────────────────────────────────────────────
//   const showAlert = useCallback((msg) => {
//     setAlert({ show: true, msg });
//     clearTimeout(alertTimer.current);
//     alertTimer.current = setTimeout(
//       () => setAlert(a => ({ ...a, show: false })),
//       3500
//     );
//   }, []);

//   // ── Durum güncelle ────────────────────────────────────────────────
//   const updateState = useCallback((next) => {
//     if (next === prevStateRef.current) return;
//     prevStateRef.current = next;
//     setFocusState(next);
//     onFocusChange?.(next);

//     const msgs = {
//       eyes_closed:  "😑 Gözlerin kapandı! Odaklanmaya devam et.",
//       looking_away: "👀 Ekrandan uzaklaştın! Göreve devam et.",
//       head_turned:  "↩️ Kafanı döndürdün! Ekrana bak.",
//       no_face:      "❓ Seni göremiyorum. Kameraya yaklaş.",
//     };
//     if (msgs[next]) showAlert(msgs[next]);
//   }, [showAlert, onFocusChange]);

//   // ── MediaPipe başlat ──────────────────────────────────────────────
//   useEffect(() => {
//     if (!enabled) return;
//     let active = true;

//     (async () => {
//       try {
//         setFocusState("loading");
//         setErrorMsg("");

//         // 1. Script'leri sırayla yükle
//         await loadAllScripts();
//         if (!active) return;

//         // 2. window.FaceMesh WASM hazır olana kadar bekle
//         const FaceMesh = await waitForFaceMesh();
//         if (!active) return;

//         // 3. FaceMesh örneği oluştur
//         const fm = new FaceMesh({
//           locateFile: (file) =>
//             `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
//         });

//         fm.setOptions({
//           maxNumFaces:            1,
//           refineLandmarks:        true,
//           minDetectionConfidence: 0.55,
//           minTrackingConfidence:  0.55,
//         });

//         fm.onResults((results) => {
//           if (!active) return;
//           const canvas = overlayRef.current;
//           if (!canvas) return;
//           const ctx = canvas.getContext("2d");
//           const { width: w, height: h } = canvas;
//           const color = STATES[prevStateRef.current]?.color ?? "#94a3b8";

//           if (!results.multiFaceLandmarks?.length) {
//             noFaceCnt.current++;
//             drawOverlay(ctx, null, color, w, h);
//             if (noFaceCnt.current >= NO_FACE_FR) updateState("no_face");
//             return;
//           }

//           noFaceCnt.current = 0;
//           const lm   = results.multiFaceLandmarks[0];
//           const earL = eyeAspectRatio(lm, LEFT_EYE);
//           const earR = eyeAspectRatio(lm, RIGHT_EYE);
//           const avg  = (earL + earR) / 2;
//           const { yaw, pitch } = headAngles(lm);

//           setMetrics({
//             yaw:  Math.round(yaw),
//             pitch: Math.round(pitch),
//             earL: earL.toFixed(2),
//             earR: earR.toFixed(2),
//           });

//           drawOverlay(ctx, lm, color, w, h);

//           if (avg < EAR_THRESH) {
//             eyeClosedCnt.current++;
//             if (eyeClosedCnt.current >= EAR_FRAMES) updateState("eyes_closed");
//           } else {
//             eyeClosedCnt.current = 0;
//             if      (Math.abs(yaw)   > YAW_THRESH)   updateState("head_turned");
//             else if (Math.abs(pitch) > PITCH_THRESH)  updateState("looking_away");
//             else                                       updateState("focused");
//           }
//         });

//         faceMeshRef.current = fm;

//         // 4. Camera yardımcısı
//         const Camera = window.Camera;
//         if (typeof Camera !== "function") throw new Error("window.Camera hazır değil");

//         const cam = new Camera(videoRef.current, {
//           onFrame: async () => {
//             if (faceMeshRef.current && videoRef.current) {
//               await faceMeshRef.current.send({ image: videoRef.current });
//             }
//           },
//           width: 240, height: 180,
//         });

//         await cam.start();
//         cameraRef.current = cam;

//         if (active) {
//           setInitialized(true);
//           setFocusState("focused");
//           prevStateRef.current = "focused";
//         }

//       } catch (err) {
//         console.error("FocusTracker init error:", err);
//         if (active) {
//           setFocusState("error");
//           setErrorMsg(err.message);
//         }
//       }
//     })();

//     return () => {
//       active = false;
//       try { cameraRef.current?.stop?.();    } catch (_) {}
//       try { faceMeshRef.current?.close?.(); } catch (_) {}
//       clearTimeout(alertTimer.current);
//     };
//   }, [enabled, updateState]);

//   const st = STATES[focusState] ?? STATES.loading;
//   const isFocused = focusState === "focused";

//   // ── Devre dışı ───────────────────────────────────────────────────
//   if (!enabled) {
//     return (
//       <div style={{ position: "fixed", top: 16, right: 16, zIndex: 400 }}>
//         <button
//           onClick={() => setEnabled(true)}
//           style={{
//             padding: "6px 14px", borderRadius: 12,
//             background: "rgba(0,0,0,0.65)", color: "white",
//             border: "1px solid rgba(255,255,255,0.2)",
//             fontSize: 11, fontWeight: 600, cursor: "pointer",
//           }}
//         >
//           👁️ Odak takibini aç
//         </button>
//       </div>
//     );
//   }

//   return (
//     <>
//       <style>{`
//         @keyframes ft-blink   { 0%,100%{opacity:1} 50%{opacity:.3} }
//         @keyframes ft-spin    { to{transform:rotate(360deg)} }
//         @keytml ft-alert { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
//         @keyframes ft-alert   { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
//       `}</style>

//       {/* ── Uyarı toast ───────────────────────────────────────────── */}
//       {alert.show && (
//         <div style={{
//           position: "fixed",
//           top: isMinimized ? 68 : 228,
//           right: 16, zIndex: 500,
//           background: "rgba(10,15,30,0.96)",
//           border: `2px solid ${st.color}`,
//           borderRadius: 14, padding: "10px 16px",
//           color: "white", fontSize: 13, fontWeight: 600,
//           maxWidth: 250,
//           boxShadow: `0 4px 20px ${st.color}55`,
//           animation: "ft-alert .25s ease",
//         }}>
//           {alert.msg}
//         </div>
//       )}

//       {/* ── Pencere ───────────────────────────────────────────────── */}
//       <div style={{
//         position: "fixed", top: 16, right: 16, zIndex: 400,
//         width: isMinimized ? 48 : 220,
//         background: "rgba(10,15,30,0.93)",
//         border: `2px solid ${isFocused ? "rgba(34,197,94,0.45)" : st.color}`,
//         borderRadius: isMinimized ? 24 : 16,
//         overflow: "hidden",
//         boxShadow: "0 6px 28px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)",
//         backdropFilter: "blur(10px)",
//         transition: "width .3s ease, border-radius .3s ease, border-color .4s ease",
//       }}>

//         {isMinimized ? (
//           <button
//             onClick={() => setIsMinimized(false)}
//             style={{
//               width: 44, height: 44, borderRadius: 22,
//               background: "none", border: "none", cursor: "pointer",
//               display: "flex", alignItems: "center", justifyContent: "center",
//               fontSize: 22,
//             }}
//             title="Odak takibini göster"
//           >
//             {st.icon}
//           </button>
//         ) : (
//           <>
//             {/* Başlık */}
//             <div style={{
//               display: "flex", alignItems: "center", justifyContent: "space-between",
//               padding: "7px 10px",
//               borderBottom: "1px solid rgba(255,255,255,0.07)",
//             }}>
//               <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
//                 <span style={{ fontSize: 13 }}>👁️</span>
//                 <span style={{ color: "white", fontSize: 11, fontWeight: 700 }}>Odak Takibi</span>
//               </div>
//               <div style={{ display: "flex", gap: 4 }}>
//                 <button
//                   onClick={() => setEnabled(false)}
//                   style={{
//                     background: "rgba(255,255,255,0.08)", border: "none",
//                     borderRadius: 5, color: "rgba(255,255,255,0.55)",
//                     fontSize: 9, padding: "2px 5px", cursor: "pointer", fontWeight: 600,
//                   }}
//                 >
//                   Kapat
//                 </button>
//                 <button
//                   onClick={() => setIsMinimized(true)}
//                   style={{
//                     background: "rgba(255,255,255,0.08)", border: "none",
//                     borderRadius: 5, color: "rgba(255,255,255,0.55)",
//                     fontSize: 14, width: 20, height: 20,
//                     cursor: "pointer",
//                     display: "flex", alignItems: "center", justifyContent: "center",
//                   }}
//                 >
//                   —
//                 </button>
//               </div>
//             </div>

//             {/* Kamera */}
//             <div style={{ position: "relative", width: "100%", height: 118, background: "#000" }}>
//               <video
//                 ref={videoRef}
//                 autoPlay playsInline muted
//                 style={{
//                   width: "100%", height: "100%",
//                   objectFit: "cover", transform: "scaleX(-1)", display: "block",
//                 }}
//               />
//               <canvas
//                 ref={overlayRef}
//                 width={240} height={180}
//                 style={{
//                   position: "absolute", inset: 0,
//                   width: "100%", height: "100%",
//                   transform: "scaleX(-1)", pointerEvents: "none",
//                 }}
//               />

//               {/* Yükleniyor */}
//               {!initialized && focusState !== "error" && (
//                 <div style={{
//                   position: "absolute", inset: 0,
//                   background: "rgba(0,0,0,0.75)",
//                   display: "flex", flexDirection: "column",
//                   alignItems: "center", justifyContent: "center", gap: 6,
//                 }}>
//                   <div style={{
//                     fontSize: 22,
//                     animation: "ft-spin 1s linear infinite",
//                     display: "inline-block",
//                   }}>⚙️</div>
//                   <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textAlign: "center", padding: "0 8px" }}>
//                     MediaPipe yükleniyor...
//                   </span>
//                 </div>
//               )}

//               {/* Hata */}
//               {focusState === "error" && (
//                 <div style={{
//                   position: "absolute", inset: 0,
//                   background: "rgba(0,0,0,0.85)",
//                   display: "flex", flexDirection: "column",
//                   alignItems: "center", justifyContent: "center", gap: 6, padding: 8,
//                 }}>
//                   <span style={{ fontSize: 22 }}>⚠️</span>
//                   <span style={{ color: "#fca5a5", fontSize: 9, textAlign: "center" }}>
//                     {errorMsg || "Kamera başlatılamadı"}
//                   </span>
//                   <button
//                     onClick={() => { setEnabled(false); setTimeout(() => setEnabled(true), 300); }}
//                     style={{
//                       marginTop: 2, padding: "3px 10px", borderRadius: 8,
//                       background: "#ef4444", border: "none",
//                       color: "white", fontSize: 10, cursor: "pointer",
//                     }}
//                   >
//                     Tekrar Dene
//                   </button>
//                 </div>
//               )}
//             </div>

//             {/* Durum */}
//             <div style={{
//               padding: "7px 10px",
//               background: `${st.color}15`,
//               borderTop: `1px solid ${st.color}30`,
//               display: "flex", alignItems: "center", gap: 7,
//             }}>
//               <div style={{
//                 width: 9, height: 9, borderRadius: "50%",
//                 background: st.color, flexShrink: 0,
//                 boxShadow: `0 0 6px ${st.color}`,
//                 animation: isFocused ? "none" : "ft-blink 1s infinite",
//               }} />
//               <span style={{ color: "white", fontSize: 11, fontWeight: 700, flex: 1 }}>
//                 {st.label}
//               </span>
//               <span style={{ fontSize: 14 }}>{st.icon}</span>
//             </div>

//             {/* Metrikler */}
//             {initialized && (
//               <div style={{
//                 padding: "6px 8px 8px",
//                 display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4,
//               }}>
//                 {[
//                   { label: "Yatay",   value: `${metrics.yaw  > 0 ? "→" : "←"} ${Math.abs(metrics.yaw)}°`,   warn: Math.abs(metrics.yaw)   > YAW_THRESH },
//                   { label: "Dikey",   value: `${metrics.pitch> 0 ? "↓" : "↑"} ${Math.abs(metrics.pitch)}°`, warn: Math.abs(metrics.pitch) > PITCH_THRESH },
//                   { label: "Sol göz", value: metrics.earL, warn: parseFloat(metrics.earL) < EAR_THRESH },
//                   { label: "Sağ göz", value: metrics.earR, warn: parseFloat(metrics.earR) < EAR_THRESH },
//                 ].map(m => (
//                   <div key={m.label} style={{
//                     background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "3px 6px",
//                     border: m.warn ? `1px solid ${st.color}55` : "1px solid transparent",
//                   }}>
//                     <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9 }}>{m.label}</div>
//                     <div style={{ color: m.warn ? st.color : "white", fontSize: 11, fontWeight: 700 }}>
//                       {m.value}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         )}
//       </div>
//     </>
//   );
// }





























import { useEffect, useRef, useState, useCallback } from "react";

// ════════════════════════════════════════════════════════════════════
//  MEDIAPIPE LOADER
// ════════════════════════════════════════════════════════════════════
const SCRIPTS = [
  "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3/drawing_utils.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh.js",
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const el = document.createElement("script");
    el.src = src; el.async = false;
    el.onload  = () => resolve();
    el.onerror = () => reject(new Error(`Yüklenemedi: ${src}`));
    document.head.appendChild(el);
  });
}
async function loadAllScripts() {
  for (const src of SCRIPTS) await loadScript(src);
}
function waitForFaceMesh(ms = 12000) {
  return new Promise((res, rej) => {
    const t0 = Date.now();
    const poll = () => {
      if (typeof window.FaceMesh === "function") return res(window.FaceMesh);
      if (Date.now() - t0 > ms) return rej(new Error("FaceMesh yüklenemedi (timeout)"));
      setTimeout(poll, 120);
    };
    poll();
  });
}

// ════════════════════════════════════════════════════════════════════
//  LANDMARK İNDEKSLERİ
// ════════════════════════════════════════════════════════════════════
const LEFT_EYE   = [362, 385, 387, 263, 373, 380];
const RIGHT_EYE  = [33,  160, 158, 133, 153, 144];
const NOSE_TIP   = 1;
const CHIN       = 152;
const LEFT_TEMP  = 234;
const RIGHT_TEMP = 454;
const FOREHEAD   = 10;

// ════════════════════════════════════════════════════════════════════
//  HESAPLAMALAR
// ════════════════════════════════════════════════════════════════════
const dist = (a, b) => Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2);

function eyeAspectRatio(lm, idx) {
  const [p1,p2,p3,p4,p5,p6] = idx.map(i => lm[i]);
  return (dist(p2,p6) + dist(p3,p5)) / (2 * dist(p1,p4));
}

function headAngles(lm) {
  const nose  = lm[NOSE_TIP], leftT = lm[LEFT_TEMP];
  const rightT= lm[RIGHT_TEMP], fore = lm[FOREHEAD], chin = lm[CHIN];
  const totalW = dist(leftT, rightT) || 0.001;
  const yaw    = ((dist(leftT, nose) / totalW) - 0.5) * 200;
  const noseY  = (nose.y - fore.y) / ((chin.y - fore.y) || 0.001);
  const pitch  = (noseY - 0.42) * 250;
  return { yaw, pitch };
}

// ════════════════════════════════════════════════════════════════════
//  AYARLAR — toleranslı eşikler
// ════════════════════════════════════════════════════════════════════
const EAR_THRESH        = 0.18;  // göz kapanma EAR sınırı
const EAR_CLOSED_FRAMES = 50;    // ~1.7 sn göz kapalı → uyarı
const YAW_THRESH        = 40;    // yatay baş açısı sınırı (°)
const PITCH_THRESH      = 36;    // dikey baş açısı sınırı (°)
const NO_FACE_FR        = 40;    // ~1.3 sn yüz yok → uyarı
// Odak barı: 0→100 → uyarı (kademeli dolup boşalır)
const BAR_FILL_SPEED    = 1.2;   // her dağınık frame'de artış
const BAR_DRAIN_SPEED   = 0.6;   // her odaklı frame'de azalış
const BAR_WARN_LEVEL    = 100;   // bu dolunca uyarı tetiklenir
const ALERT_COOLDOWN_MS = 7000;  // aynı uyarı en erken bu kadar sonra tekrar

// ════════════════════════════════════════════════════════════════════
//  CANVAS ÇİZİCİ
// ════════════════════════════════════════════════════════════════════
function drawOverlay(ctx, lm, color, w, h) {
  ctx.clearRect(0, 0, w, h);
  if (!lm) return;
  for (const idx of [LEFT_EYE, RIGHT_EYE]) {
    ctx.beginPath();
    idx.forEach((id, i) => {
      const p = lm[id];
      i === 0 ? ctx.moveTo(p.x*w, p.y*h) : ctx.lineTo(p.x*w, p.y*h);
    });
    ctx.closePath();
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
  }
  const n = lm[NOSE_TIP];
  ctx.beginPath(); ctx.arc(n.x*w, n.y*h, 3, 0, Math.PI*2);
  ctx.fillStyle = color; ctx.fill();
  const { yaw, pitch } = headAngles(lm);
  const cx = n.x*w, cy = n.y*h;
  const dx = Math.sin((yaw/100)*(Math.PI/2))*22;
  const dy = Math.sin((pitch/100)*(Math.PI/2))*22;
  ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+dx,cy+dy);
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx+dx,cy+dy,3,0,Math.PI*2);
  ctx.fillStyle = color; ctx.fill();
}

// ════════════════════════════════════════════════════════════════════
//  DURUM TANIMLARI
// ════════════════════════════════════════════════════════════════════
const STATES = {
  focused:      { label: "Odaklı",          color: "#22c55e", icon: "🟢" },
  eyes_closed:  { label: "Gözler Kapalı",   color: "#f59e0b", icon: "😑" },
  looking_away: { label: "Dikkati Dağıldı", color: "#ef4444", icon: "👀" },
  head_turned:  { label: "Kafa Döndü",      color: "#ef4444", icon: "↩️"  },
  no_face:      { label: "Yüz Bulunamadı",  color: "#94a3b8", icon: "❓" },
  loading:      { label: "Yükleniyor...",   color: "#94a3b8", icon: "⏳" },
  error:        { label: "Hata",            color: "#dc2626", icon: "⚠️" },
};

// ════════════════════════════════════════════════════════════════════
//  ANA BİLEŞEN
// ════════════════════════════════════════════════════════════════════
export default function FocusTracker({ onFocusChange }) {
  const videoRef    = useRef(null);
  const overlayRef  = useRef(null);
  const faceMeshRef = useRef(null);
  const cameraRef   = useRef(null);

  const [focusState,  setFocusState]  = useState("loading");
  const [focusBar,    setFocusBar]    = useState(0);   // 0–100
  const [metrics,     setMetrics]     = useState({ yaw:0, pitch:0, earL:"—", earR:"—" });
  const [initialized, setInitialized] = useState(false);
  const [errorMsg,    setErrorMsg]    = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [enabled,     setEnabled]     = useState(true);

  // Pencere içi uyarı bandı (başlığın hemen altında, kameranın üstünde değil)
  const [inlineAlert, setInlineAlert] = useState({ show: false, msg: "", color: "#ef4444" });

  // Sayaçlar — ref (render tetiklemesin)
  const eyeClosedCnt  = useRef(0);
  const noFaceCnt     = useRef(0);
  const barValue      = useRef(0);    // float, setFocusBar throttle için
  const prevStateRef  = useRef("loading");
  const lastAlertTime = useRef({});
  const inlineTimer   = useRef(null);

  // ── Inline uyarı (pencere içi, cooldown'lu) ──────────────────────
  const fireAlert = useCallback((stateKey, msg, color) => {
    const now = Date.now();
    if ((now - (lastAlertTime.current[stateKey] ?? 0)) < ALERT_COOLDOWN_MS) return;
    lastAlertTime.current[stateKey] = now;
    setInlineAlert({ show: true, msg, color });
    clearTimeout(inlineTimer.current);
    inlineTimer.current = setTimeout(
      () => setInlineAlert(a => ({ ...a, show: false })), 4500
    );
  }, []);

  // ── Durum güncelle ────────────────────────────────────────────────
  const updateState = useCallback((next) => {
    if (next === prevStateRef.current) return;
    prevStateRef.current = next;
    setFocusState(next);
    onFocusChange?.(next);
    const alerts = {
      eyes_closed:  ["😑 Gözlerin uzun süre kapandı. Odaklanmaya devam et!", "#f59e0b"],
      looking_away: ["👀 Ekrandan uzaklaştın. Göreve devam et!",             "#ef4444"],
      head_turned:  ["↩️ Kafanı döndürdün. Ekrana bakabilirsin.",            "#ef4444"],
      no_face:      ["❓ Seni göremiyorum. Kameraya yaklaş.",                 "#94a3b8"],
    };
    if (alerts[next]) fireAlert(next, ...alerts[next]);
  }, [fireAlert, onFocusChange]);

  // ── MediaPipe başlat ──────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    let active = true;

    (async () => {
      try {
        setFocusState("loading"); setErrorMsg("");
        await loadAllScripts();
        if (!active) return;
        const FaceMesh = await waitForFaceMesh();
        if (!active) return;

        const fm = new FaceMesh({
          locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${f}`,
        });
        fm.setOptions({
          maxNumFaces: 1, refineLandmarks: true,
          minDetectionConfidence: 0.55, minTrackingConfidence: 0.55,
        });

        fm.onResults((results) => {
          if (!active) return;
          const canvas = overlayRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          const { width: w, height: h } = canvas;
          const color = STATES[prevStateRef.current]?.color ?? "#94a3b8";

          // ── Yüz yok ────────────────────────────────────────────────
          if (!results.multiFaceLandmarks?.length) {
            noFaceCnt.current++;
            drawOverlay(ctx, null, color, w, h);
            // Bar yavaş boşal
            barValue.current = Math.max(barValue.current - BAR_DRAIN_SPEED, 0);
            setFocusBar(Math.round(barValue.current));
            if (noFaceCnt.current >= NO_FACE_FR) updateState("no_face");
            return;
          }

          noFaceCnt.current = 0;
          const lm    = results.multiFaceLandmarks[0];
          const earL  = eyeAspectRatio(lm, LEFT_EYE);
          const earR  = eyeAspectRatio(lm, RIGHT_EYE);
          const avg   = (earL + earR) / 2;
          const { yaw, pitch } = headAngles(lm);

          setMetrics({ yaw: Math.round(yaw), pitch: Math.round(pitch),
            earL: earL.toFixed(2), earR: earR.toFixed(2) });
          drawOverlay(ctx, lm, color, w, h);

          // ── Göz kapanma (ayrı sayaç, bara bağlı değil) ────────────
          if (avg < EAR_THRESH) {
            eyeClosedCnt.current++;
            if (eyeClosedCnt.current >= EAR_CLOSED_FRAMES) updateState("eyes_closed");
          } else {
            eyeClosedCnt.current = 0;
          }

          // ── Odak barı — kademeli dol / boşal ─────────────────────
          const isDistracted = Math.abs(yaw) > YAW_THRESH || Math.abs(pitch) > PITCH_THRESH;

          if (isDistracted) {
            barValue.current = Math.min(barValue.current + BAR_FILL_SPEED, BAR_WARN_LEVEL);
          } else {
            barValue.current = Math.max(barValue.current - BAR_DRAIN_SPEED, 0);
          }
          setFocusBar(Math.round(barValue.current));

          // ── Uyarı: bar tamamen dolunca ─────────────────────────────
          if (barValue.current >= BAR_WARN_LEVEL) {
            if (Math.abs(yaw) > YAW_THRESH) updateState("head_turned");
            else                             updateState("looking_away");
          } else if (barValue.current < 10 && eyeClosedCnt.current < 5) {
            updateState("focused");
          }
        });

        faceMeshRef.current = fm;
        const Camera = window.Camera;
        if (typeof Camera !== "function") throw new Error("window.Camera hazır değil");
        const cam = new Camera(videoRef.current, {
          onFrame: async () => {
            if (faceMeshRef.current && videoRef.current)
              await faceMeshRef.current.send({ image: videoRef.current });
          },
          width: 240, height: 180,
        });
        await cam.start();
        cameraRef.current = cam;
        if (active) {
          setInitialized(true); setFocusState("focused");
          prevStateRef.current = "focused";
        }
      } catch (err) {
        console.error("FocusTracker init error:", err);
        if (active) { setFocusState("error"); setErrorMsg(err.message); }
      }
    })();

    return () => {
      active = false;
      try { cameraRef.current?.stop?.();    } catch(_) {}
      try { faceMeshRef.current?.close?.(); } catch(_) {}
      clearTimeout(inlineTimer.current);
    };
  }, [enabled, updateState]);

  // ════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════
  const st = STATES[focusState] ?? STATES.loading;
  const isFocused = focusState === "focused";

  // Bar rengi: yeşil → sarı → kırmızı
  const barColor = focusBar > 74
    ? "linear-gradient(90deg,#f59e0b,#ef4444)"
    : focusBar > 44 ? "#f59e0b" : "#22c55e";

  if (!enabled) return (
    <div style={{ position:"fixed", top:16, right:16, zIndex:400 }}>
      <button onClick={() => setEnabled(true)} style={{
        padding:"6px 14px", borderRadius:12,
        background:"rgba(0,0,0,0.65)", color:"white",
        border:"1px solid rgba(255,255,255,0.2)",
        fontSize:11, fontWeight:600, cursor:"pointer",
      }}> Odak takibini aç</button>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes ft-blink  { 0%,100%{opacity:1} 50%{opacity:.25} }
        @keyframes ft-spin   { to{transform:rotate(360deg)} }
        @keyframes ft-alert  { from{opacity:0;max-height:0;padding:0 10px} to{opacity:1;max-height:60px;padding:6px 10px} }
      `}</style>

      <div style={{
        position:"fixed", top:16, right:16, zIndex:400,
        width: isMinimized ? 48 : 222,
        background:"rgba(10,15,30,0.93)",
        border:`2px solid ${isFocused ? "rgba(34,197,94,0.4)" : st.color}`,
        borderRadius: isMinimized ? 24 : 16,
        overflow:"hidden",
        boxShadow:"0 6px 28px rgba(0,0,0,0.65),0 0 0 1px rgba(255,255,255,0.05)",
        backdropFilter:"blur(10px)",
        transition:"width .3s ease, border-radius .3s ease, border-color .4s ease",
      }}>

        {isMinimized ? (
          /* ── Küçültülmüş ─────────────────────────────────────────── */
          <button onClick={() => setIsMinimized(false)} style={{
            width:44, height:44, borderRadius:22, background:"none",
            border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22,
          }} title="Odak takibini göster">{st.icon}</button>

        ) : (
          <>
            {/* ── Başlık ──────────────────────────────────────────── */}
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"7px 10px", borderBottom:"1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                {/* <span style={{ fontSize:13 }}></span> */}
                <span style={{ color:"white", fontSize:11, fontWeight:700 }}>Odak Takibi</span>
              </div>
              <div style={{ display:"flex", gap:4 }}>
                <button onClick={() => setEnabled(false)} style={{
                  background:"rgba(255,255,255,0.08)", border:"none", borderRadius:5,
                  color:"rgba(255,255,255,0.55)", fontSize:9, padding:"2px 5px",
                  cursor:"pointer", fontWeight:600,
                }}>Kapat</button>
                <button onClick={() => setIsMinimized(true)} style={{
                  background:"rgba(255,255,255,0.08)", border:"none", borderRadius:5,
                  color:"rgba(255,255,255,0.55)", fontSize:14, width:20, height:20,
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                }}>—</button>
              </div>
            </div>

            {/* ── Inline uyarı bandı (başlık altı, kamera üstü değil) ── */}
            {inlineAlert.show && (
              <div style={{
                padding:"6px 10px", overflow:"hidden",
                background:`${inlineAlert.color}20`,
                borderBottom:`1.5px solid ${inlineAlert.color}50`,
                display:"flex", alignItems:"center", gap:7,
                animation:"ft-alert .25s ease",
              }}>
                <div style={{
                  width:7, height:7, borderRadius:"50%", flexShrink:0,
                  background:inlineAlert.color,
                  animation:"ft-blink .8s infinite",
                }}/>
                <span style={{
                  color:"white", fontSize:10, fontWeight:600, lineHeight:1.35,
                }}>
                  {inlineAlert.msg}
                </span>
              </div>
            )}

            {/* ── Kamera önizleme ──────────────────────────────────── */}
            <div style={{ position:"relative", width:"100%", height:116, background:"#000" }}>
              <video ref={videoRef} autoPlay playsInline muted style={{
                width:"100%", height:"100%", objectFit:"cover",
                transform:"scaleX(-1)", display:"block",
              }}/>
              <canvas ref={overlayRef} width={240} height={180} style={{
                position:"absolute", inset:0,
                width:"100%", height:"100%",
                transform:"scaleX(-1)", pointerEvents:"none",
              }}/>

              {!initialized && focusState !== "error" && (
                <div style={{
                  position:"absolute", inset:0, background:"rgba(0,0,0,0.75)",
                  display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", gap:6,
                }}>
                  <div style={{ fontSize:22, animation:"ft-spin 1s linear infinite", display:"inline-block" }}>⚙️</div>
                  <span style={{ color:"rgba(255,255,255,0.6)", fontSize:10, textAlign:"center", padding:"0 8px" }}>
                    MediaPipe yükleniyor...
                  </span>
                </div>
              )}

              {focusState === "error" && (
                <div style={{
                  position:"absolute", inset:0, background:"rgba(0,0,0,0.85)",
                  display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", gap:6, padding:8,
                }}>
                  <span style={{ fontSize:22 }}>⚠️</span>
                  <span style={{ color:"#fca5a5", fontSize:9, textAlign:"center" }}>{errorMsg}</span>
                  <button onClick={() => { setEnabled(false); setTimeout(()=>setEnabled(true),300); }} style={{
                    padding:"3px 10px", borderRadius:8, background:"#ef4444",
                    border:"none", color:"white", fontSize:10, cursor:"pointer",
                  }}>Tekrar Dene</button>
                </div>
              )}
            </div>

            {/* ── Odak barı ─────────────────────────────────────────── */}
            {initialized && (
              <div style={{ padding:"7px 10px 6px", background:"rgba(0,0,0,0.35)" }}>
                <div style={{
                  display:"flex", justifyContent:"space-between",
                  alignItems:"center", marginBottom:5,
                }}>
                  <span style={{ color:"rgba(255,255,255,0.45)", fontSize:9, fontWeight:700, letterSpacing:".5px" }}>
                    ODAK DURUMU
                  </span>
                  <span style={{
                    fontSize:9, fontWeight:700,
                    color: focusBar > 74 ? "#ef4444" : focusBar > 44 ? "#f59e0b" : "#22c55e",
                  }}>
                    {focusBar > 74 ? "⚠ Dikkat Dağınık" : focusBar > 44 ? "Dikkatli Ol" : "✓ Odaklı"}
                  </span>
                </div>

                {/* Bar */}
                <div style={{
                  width:"100%", height:7, borderRadius:4,
                  background:"rgba(255,255,255,0.08)",
                  overflow:"hidden", position:"relative",
                }}>
                  {/* Kırmızı bölge işaretçisi */}
                  <div style={{
                    position:"absolute", right:0, top:0,
                    width:"26%", height:"100%",
                    background:"rgba(239,68,68,0.18)",
                    borderLeft:"1px dashed rgba(239,68,68,0.5)",
                  }}/>
                  {/* Dolup boşalan bar */}
                  <div style={{
                    height:"100%", borderRadius:4,
                    width:`${focusBar}%`,
                    background: barColor,
                    transition:"width .3s ease, background .5s ease",
                    boxShadow: focusBar > 74 ? "0 0 6px rgba(239,68,68,0.6)" : "none",
                  }}/>
                </div>
              </div>
            )}

            {/* ── Durum satırı ──────────────────────────────────────── */}
            <div style={{
              padding:"6px 10px",
              background:`${st.color}12`,
              borderTop:`1px solid ${st.color}28`,
              display:"flex", alignItems:"center", gap:7,
            }}>
              <div style={{
                width:9, height:9, borderRadius:"50%",
                background:st.color, flexShrink:0,
                boxShadow:`0 0 5px ${st.color}`,
                animation: isFocused ? "none" : "ft-blink 1s infinite",
              }}/>
              <span style={{ color:"white", fontSize:11, fontWeight:700, flex:1 }}>{st.label}</span>
              <span style={{ fontSize:13 }}>{st.icon}</span>
            </div>

            {/* ── Metrikler ─────────────────────────────────────────── */}
            {initialized && (
              <div style={{
                padding:"5px 8px 7px",
                display:"grid", gridTemplateColumns:"1fr 1fr", gap:3,
              }}>
                {[
                  { label:"Yatay",   value:`${metrics.yaw  >0?"→":"←"} ${Math.abs(metrics.yaw)}°`,   warn:Math.abs(metrics.yaw)  >YAW_THRESH },
                  { label:"Dikey",   value:`${metrics.pitch>0?"↓":"↑"} ${Math.abs(metrics.pitch)}°`, warn:Math.abs(metrics.pitch)>PITCH_THRESH },
                  { label:"Sol göz", value:metrics.earL, warn:parseFloat(metrics.earL)<EAR_THRESH },
                  { label:"Sağ göz", value:metrics.earR, warn:parseFloat(metrics.earR)<EAR_THRESH },
                ].map(m => (
                  <div key={m.label} style={{
                    background:"rgba(255,255,255,0.04)", borderRadius:5, padding:"3px 6px",
                    border:m.warn?`1px solid ${st.color}44`:"1px solid transparent",
                  }}>
                    <div style={{ color:"rgba(255,255,255,0.35)", fontSize:8 }}>{m.label}</div>
                    <div style={{ color:m.warn?st.color:"white", fontSize:10, fontWeight:700 }}>{m.value}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}