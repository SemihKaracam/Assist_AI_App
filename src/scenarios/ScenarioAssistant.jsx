// import { useState, useRef, useEffect, useCallback } from "react";

// // ════════════════════════════════════════════════════════════════════
// //  CONFIG  —  .env dosyasına ekle:
// //    VITE_ANTHROPIC_API_KEY=sk-ant-...
// //    VITE_OPENAI_API_KEY=sk-...
// //    VITE_ELEVENLABS_API_KEY=...
// //    VITE_ELEVENLABS_VOICE_ID=...   (Türkçe ses ID'si)
// // ════════════════════════════════════════════════════════════════════
// const CFG = {
//     mistral: import.meta.env.VITE_MISTRAL_API_KEY ?? "",
//     elevenlabs: import.meta.env.VITE_ELEVENLABS_API_KEY ?? "",
//     voiceId: import.meta.env.VITE_ELEVENLABS_VOICE_ID ?? "pNInz6obpgDQGcFmaJgB",
//     // ↑ varsayılan: Adam (ElevenLabs demo sesi). Türkçe için özel bir ses ID'si gir.
// };

// // ────────────────────────────────────────────────────────────────────
// //  SYSTEM PROMPT
// // ────────────────────────────────────────────────────────────────────
// function buildSystemPrompt({ screen, shoppingList, collected, activeSection }) {
//     const remaining = shoppingList.filter(i => !collected.includes(i.id));
//     const done = shoppingList.filter(i => collected.includes(i.id));
//     const loc = {
//         overview: "market girişi — bölüm seçim ekranı",
//         bakery: "fırın reyonu",
//         dairy: "süt ve süt ürünleri reyonu",
//         fruits: "meyve ve sebze reyonu",
//         kasa: "kasa — ödeme ekranı",
//     };
//     const currentLocation = screen === "shelf"
//         ? (loc[activeSection] ?? activeSection)
//         : (loc[screen] ?? screen);

//     return `Sen "Hayat Kolay" uygulamasında bir market alışveriş asistanısın. Otizmli bireylerin gerçek hayat senaryolarını öğrenmesine yardım ediyorsun.

// KURAL — SADECE ŞUNLARDA YARDIM ET:
// - Alışveriş listesindeki ürünleri bulmak ve hangi reyon olduğunu söylemek
// - Market bölümlerini tanıtmak (fırın, süt ürünleri, meyve & sebze, kasa)
// - Ödeme yöntemleri (kart veya nakit nasıl yapılır)
// - Alışveriş sırası ve adımları
// - Sosyal beceriler: kasiyere selam vermek, teşekkür etmek vb.

// Bunların dışında konu gelirse kibarca reddet ve alışverişe yönlendir.

// MEVCUT DURUM:
// Konum         : ${currentLocation}
// Alışveriş listesi : ${shoppingList.map(i => i.name).join(", ")}
// Alınan ürünler    : ${done.length > 0 ? done.map(i => i.name).join(", ") : "henüz yok"}
// Kalan ürünler     : ${remaining.length > 0
//             ? remaining.map(i => `${i.name} (${i.section === "dairy" ? "süt ürünleri" :
//                 i.section === "fruits" ? "meyve & sebze" : "fırın"} reyonunda)`).join(", ")
//             : "tümü alındı — kasaya gidebilirsin!"}

// CEVAP STİLİ:
// - Kısa ve sade (max 2-3 cümle)
// - Sıcak, cesaretlendirici ton
// - Türkçe cevap ver
// - Sesle okunacak; emoji veya özel karakter kullanma`;
// }

// // ════════════════════════════════════════════════════════════════════
// //  API CALLS
// // ════════════════════════════════════════════════════════════════════

// // ── 1. STT: Whisper ──────────────────────────────────────────────────
// // ── 1. STT: ElevenLabs ─────────────────────────────────────────────
// async function transcribeWithElevenLabs(audioBlob) {
//     const form = new FormData();

//     form.append("file", audioBlob, "recording.webm");
//     form.append("model_id", "scribe_v1"); // ElevenLabs STT modeli
//     form.append("language_code", "tur");  // Türkçe

//     const res = await fetch(
//         "https://api.elevenlabs.io/v1/speech-to-text",
//         {
//             method: "POST",
//             headers: {
//                 "xi-api-key": CFG.elevenlabs,
//             },
//             body: form,
//         }
//     );

//     if (!res.ok) {
//         const errText = await res.text();
//         throw new Error(`ElevenLabs STT error: ${res.status} ${errText}`);
//     }

//     const data = await res.json();

//     return data.text?.trim() ?? "";
// }

// // ── 2. LLM: Mistral   ──────────────────────────────────────────
// async function askMistral(message) {
//   const res = await fetch(
//     "https://api.mistral.ai/v1/chat/completions",
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${CFG.mistral}`,
//       },
//       body: JSON.stringify({
//         model: "mistral-small-latest",

//         messages: [
//           {
//             role: "system",
//             content:
//               "Sen bir AVM içindeki yardımcı sesli asistansın. Türkçe konuş. Kısa, doğal ve net cevap ver.",
//           },
//           {
//             role: "user",
//             content: message,
//           },
//         ],

//         temperature: 0.7,
//       }),
//     }
//   );

//   const text = await res.text();

//   console.log("Mistral raw:", text);

//   if (!res.ok) {
//     throw new Error(
//       `Mistral error ${res.status}: ${text}`
//     );
//   }

//   const data = JSON.parse(text);

//   return (
//     data.choices?.[0]?.message?.content?.trim() ??
//     ""
//   );
// }

// // ── 3. TTS: ElevenLabs ───────────────────────────────────────────────
// async function speakWithElevenLabs(text, voiceId) {
//     const res = await fetch(
//         `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
//         {
//             method: "POST",
//             headers: {
//                 "xi-api-key": CFG.elevenlabs,
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 text,
//                 model_id: "eleven_multilingual_v2",   // Türkçe destekler
//                 voice_settings: { stability: 0.55, similarity_boost: 0.80, style: 0.20 },
//             }),
//         }
//     );
//     if (!res.ok) throw new Error(`ElevenLabs error: ${res.status}`);
//     const blob = await res.blob();
//     const url = URL.createObjectURL(blob);
//     return url; // <audio> src'e ver ya da doğrudan oynat
// }

// // ════════════════════════════════════════════════════════════════════
// //  HOOKS
// // ════════════════════════════════════════════════════════════════════

// // ── Mikrofon kaydı ────────────────────────────────────────────────────
// function useMicrophone() {
//     const [isRecording, setIsRecording] = useState(false);
//     const [isProcessing, setIsProcessing] = useState(false);  // Whisper bekliyor
//     const mediaRecorderRef = useRef(null);
//     const chunksRef = useRef([]);

//     const startRecording = useCallback(async (onTranscript, onError) => {
//         try {
//             const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

//             // Desteklenen format seç
//             const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
//                 ? "audio/webm;codecs=opus"
//                 : MediaRecorder.isTypeSupported("audio/webm")
//                     ? "audio/webm"
//                     : "audio/ogg";

//             const recorder = new MediaRecorder(stream, { mimeType });
//             mediaRecorderRef.current = recorder;
//             chunksRef.current = [];

//             recorder.ondataavailable = e => {
//                 if (e.data.size > 0) chunksRef.current.push(e.data);
//             };

//             recorder.onstop = async () => {
//                 stream.getTracks().forEach(t => t.stop());
//                 setIsRecording(false);
//                 setIsProcessing(true);
//                 try {
//                     const blob = new Blob(chunksRef.current, { type: mimeType });
//                     const transcript = await transcribeWithElevenLabs(blob);
//                     onTranscript(transcript);
//                 } catch (err) {
//                     onError?.(err.message);
//                 } finally {
//                     setIsProcessing(false);
//                 }
//             };

//             recorder.start();
//             setIsRecording(true);
//         } catch (err) {
//             onError?.(err.message);
//         }
//     }, []);

//     const stopRecording = useCallback(() => {
//         mediaRecorderRef.current?.stop();
//     }, []);

//     return { isRecording, isProcessing, startRecording, stopRecording };
// }

// // ── ElevenLabs TTS oynatıcı ───────────────────────────────────────────
// function useTTS() {
//     const [isSpeaking, setIsSpeaking] = useState(false);
//     const [isLoadingTTS, setIsLoadingTTS] = useState(false);
//     const audioRef = useRef(null);

//     const speak = useCallback(async (text) => {
//         // Öncekini durdur
//         if (audioRef.current) {
//             audioRef.current.pause();
//             audioRef.current = null;
//         }
//         setIsLoadingTTS(true);
//         try {
//             const url = await speakWithElevenLabs(text, CFG.voiceId);
//             const audio = new Audio(url);
//             audioRef.current = audio;
//             audio.onplay = () => { setIsSpeaking(true); setIsLoadingTTS(false); };
//             audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
//             audio.onerror = () => { setIsSpeaking(false); setIsLoadingTTS(false); };
//             await audio.play();
//         } catch (err) {
//             console.error("TTS error:", err);
//             setIsLoadingTTS(false);
//         }
//     }, []);

//     const stop = useCallback(() => {
//         if (audioRef.current) {
//             audioRef.current.pause();
//             audioRef.current = null;
//         }
//         setIsSpeaking(false);
//         setIsLoadingTTS(false);
//     }, []);

//     return { isSpeaking, isLoadingTTS, speak, stop };
// }

// // ════════════════════════════════════════════════════════════════════
// //  UI BİLEŞENLERİ
// // ════════════════════════════════════════════════════════════════════

// function AvatarButton({ onClick, hasUnread, isOpen, isSpeaking, isLoadingTTS }) {
//     return (
//         <button
//             onClick={onClick}
//             style={{
//                 position: "relative", display: "flex", flexDirection: "column",
//                 alignItems: "center", gap: 4, background: "none", border: "none",
//                 cursor: "pointer", padding: 0, transition: "transform 0.15s",
//             }}
//             onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
//             onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
//             title="Yardım Al"
//         >
//             {/* Konuşma halkası */}
//             {(isSpeaking || isLoadingTTS) && (
//                 <div style={{
//                     position: "absolute", inset: -7, borderRadius: "50%",
//                     border: `3px solid ${isLoadingTTS ? "#94a3b8" : "#f59e0b"}`,
//                     animation: "pulseRing 1s ease-out infinite",
//                 }} />
//             )}

//             <div style={{
//                 width: 58, height: 58, borderRadius: "50%",
//                 background: isOpen
//                     ? "linear-gradient(135deg, #f59e0b, #f97316)"
//                     : "linear-gradient(135deg, #fbbf24, #fb923c)",
//                 border: "3px solid white",
//                 boxShadow: "0 4px 18px rgba(0,0,0,0.4)",
//                 display: "flex", alignItems: "center", justifyContent: "center",
//                 fontSize: 28, transition: "all 0.2s",
//             }}>
//                 🧑‍🏫
//             </div>

//             {hasUnread && !isOpen && (
//                 <div style={{
//                     position: "absolute", top: 0, right: 0,
//                     width: 14, height: 14, borderRadius: "50%",
//                     background: "#ef4444", border: "2px solid white",
//                 }} />
//             )}

//             <span style={{
//                 fontSize: 10, fontWeight: 700, color: "white",
//                 background: "rgba(0,0,0,0.55)", borderRadius: 6,
//                 padding: "1px 6px", whiteSpace: "nowrap",
//             }}>
//                 Yardım
//             </span>
//         </button>
//     );
// }

// // ── Durum çubuğu (header alt kısmı) ──────────────────────────────────
// function StatusBar({ isRecording, isProcessing, isSpeaking, isLoadingTTS, isThinking }) {
//     if (isRecording) return <Bar color="#ef4444" icon="🎙️" text="Seni dinliyorum..." pulse />;
//     if (isProcessing) return <Bar color="#8b5cf6" icon="⚙️" text="Ses işleniyor..." />;
//     if (isThinking) return <Bar color="#2563eb" icon="💭" text="Düşünüyorum..." />;
//     if (isLoadingTTS) return <Bar color="#64748b" icon="🔊" text="Ses hazırlanıyor..." />;
//     if (isSpeaking) return <Bar color="#f59e0b" icon="🔊" text="Konuşuyor..." pulse />;
//     return <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>Sana yardımcı olmaya hazır</span>;
// }
// function Bar({ color, icon, text, pulse }) {
//     return (
//         <span style={{
//             display: "inline-flex", alignItems: "center", gap: 5,
//             color: "white", fontSize: 11, fontWeight: 600,
//             animation: pulse ? "statusPulse 1.2s infinite" : "none",
//         }}>
//             <span style={{ fontSize: 13 }}>{icon}</span>{text}
//         </span>
//     );
// }

// // ── Chat paneli ────────────────────────────────────────────────────────
// function ChatPanel({
//     messages, onSend, onClose,
//     onSpeak, onStopSpeak,
//     isRecording, isProcessing, isSpeaking, isLoadingTTS, isThinking,
//     onMicStart, onMicStop,
//     autoSpeak, onToggleAutoSpeak,
// }) {
//     const [input, setInput] = useState("");
//     const bottomRef = useRef(null);
//     const isBusy = isRecording || isProcessing || isThinking || isLoadingTTS;

//     useEffect(() => {
//         bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//     }, [messages, isThinking, isSpeaking]);

//     const QUICK = [
//         "Nereden başlamalıyım?",
//         "Hangi ürünleri almam lazım?",
//         "Şu an neredeyim?",
//         "Kasada ne yapmalıyım?",
//     ];

//     function handleSend(text) {
//         const msg = (text ?? input).trim();
//         if (!msg || isBusy) return;
//         setInput("");
//         onSend(msg);
//     }

//     return (
//         <div style={{
//             width: 340, height: 510,
//             background: "white", borderRadius: 22,
//             boxShadow: "0 16px 56px rgba(0,0,0,0.55)",
//             display: "flex", flexDirection: "column", overflow: "hidden",
//         }}>

//             {/* Header */}
//             <div style={{
//                 background: "linear-gradient(135deg, #f59e0b, #f97316)",
//                 padding: "12px 16px", flexShrink: 0,
//             }}>
//                 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//                     <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                         <span style={{ fontSize: 26 }}>🧑‍🏫</span>
//                         <div>
//                             <div style={{ color: "white", fontWeight: 800, fontSize: 14 }}>Market Asistanı</div>
//                             <StatusBar
//                                 isRecording={isRecording} isProcessing={isProcessing}
//                                 isSpeaking={isSpeaking} isLoadingTTS={isLoadingTTS}
//                                 isThinking={isThinking}
//                             />
//                         </div>
//                     </div>
//                     <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                         {/* Otomatik sesli yanıt toggle */}
//                         <button
//                             onClick={onToggleAutoSpeak}
//                             title={autoSpeak ? "Sesli yanıtı kapat" : "Sesli yanıtı aç"}
//                             style={{
//                                 width: 32, height: 32, borderRadius: "50%", border: "none",
//                                 background: autoSpeak ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)",
//                                 cursor: "pointer", fontSize: 15,
//                                 display: "flex", alignItems: "center", justifyContent: "center",
//                             }}
//                         >
//                             {autoSpeak ? "🔊" : "🔇"}
//                         </button>
//                         <button
//                             onClick={onClose}
//                             style={{
//                                 color: "white", fontSize: 20, fontWeight: 700,
//                                 background: "none", border: "none", cursor: "pointer", lineHeight: 1,
//                             }}
//                         >✕</button>
//                     </div>
//                 </div>
//             </div>

//             {/* Messages */}
//             <div style={{
//                 flex: 1, overflowY: "auto", padding: 12,
//                 background: "#f8fafc", display: "flex", flexDirection: "column", gap: 8,
//             }}>
//                 {messages.map((m, i) => (
//                     <div key={i} style={{
//                         display: "flex",
//                         justifyContent: m.role === "user" ? "flex-end" : "flex-start",
//                         alignItems: "flex-end", gap: 6,
//                     }}>
//                         {m.role === "assistant" && <span style={{ fontSize: 18, flexShrink: 0 }}>🧑‍🏫</span>}
//                         <div style={{
//                             maxWidth: "78%", padding: "9px 13px", borderRadius: 14,
//                             fontSize: 13, lineHeight: 1.55,
//                             background: m.role === "user" ? "#f59e0b" : "white",
//                             color: m.role === "user" ? "white" : "#1e293b",
//                             boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
//                             borderBottomRightRadius: m.role === "user" ? 4 : 14,
//                             borderBottomLeftRadius: m.role === "user" ? 14 : 4,
//                         }}>
//                             {m.content}
//                         </div>
//                         {/* Tekrar dinle butonu */}
//                         {m.role === "assistant" && (
//                             <button
//                                 onClick={() => isSpeaking ? onStopSpeak() : onSpeak(m.content)}
//                                 style={{
//                                     background: "none", border: "none", cursor: "pointer",
//                                     fontSize: 14, opacity: 0.55, flexShrink: 0, padding: 2,
//                                     transition: "opacity 0.15s",
//                                 }}
//                                 onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
//                                 onMouseLeave={e => { e.currentTarget.style.opacity = "0.55"; }}
//                                 title="Tekrar dinle"
//                             >
//                                 {isSpeaking ? "⏹" : "▶"}
//                             </button>
//                         )}
//                     </div>
//                 ))}

//                 {/* Thinking indicator */}
//                 {isThinking && (
//                     <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
//                         <span style={{ fontSize: 18 }}>🧑‍🏫</span>
//                         <div style={{
//                             background: "white", borderRadius: 14, padding: "10px 14px",
//                             boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
//                         }}>
//                             <div style={{ display: "flex", gap: 4 }}>
//                                 {[0, 1, 2].map(n => (
//                                     <div key={n} style={{
//                                         width: 7, height: 7, borderRadius: "50%", background: "#94a3b8",
//                                         animation: `dotBounce 1.2s infinite ${n * 0.2}s`,
//                                     }} />
//                                 ))}
//                             </div>
//                         </div>
//                     </div>
//                 )}
//                 <div ref={bottomRef} />
//             </div>

//             {/* Hızlı sorular */}
//             {messages.length <= 1 && (
//                 <div style={{
//                     padding: "6px 12px", display: "flex", flexWrap: "wrap", gap: 6,
//                     flexShrink: 0, background: "white", borderTop: "1px solid #f1f5f9",
//                 }}>
//                     {QUICK.map(q => (
//                         <button key={q} onClick={() => handleSend(q)} style={{
//                             fontSize: 11, padding: "5px 10px", borderRadius: 20,
//                             background: "#fef3c7", color: "#92400e",
//                             border: "1px solid #fde68a", fontWeight: 600, cursor: "pointer",
//                         }}>
//                             {q}
//                         </button>
//                     ))}
//                 </div>
//             )}

//             {/* Input */}
//             <div style={{
//                 padding: "10px 12px", borderTop: "1px solid #e2e8f0",
//                 display: "flex", gap: 8, flexShrink: 0, background: "white",
//             }}>
//                 <input
//                     value={input}
//                     onChange={e => setInput(e.target.value)}
//                     onKeyDown={e => e.key === "Enter" && handleSend()}
//                     placeholder={
//                         isRecording ? "Dinleniyor..." :
//                             isProcessing ? "İşleniyor..." :
//                                 isThinking ? "Yanıt geliyor..." :
//                                     "Mesaj yaz..."
//                     }
//                     disabled={isBusy}
//                     style={{
//                         flex: 1, borderRadius: 12, border: "1.5px solid #e2e8f0",
//                         padding: "8px 12px", fontSize: 13, outline: "none",
//                         background: isRecording ? "#fef3c7" : isProcessing ? "#f3e8ff" : "white",
//                         transition: "background 0.2s",
//                     }}
//                     onFocus={e => { e.target.style.borderColor = "#f59e0b"; }}
//                     onBlur={e => { e.target.style.borderColor = "#e2e8f0"; }}
//                 />

//                 {/* Mikrofon */}
//                 <button
//                     onMouseDown={onMicStart}
//                     onMouseUp={onMicStop}
//                     onTouchStart={onMicStart}
//                     onTouchEnd={onMicStop}
//                     disabled={isProcessing || isThinking}
//                     title="Basılı tut → konuş → bırak"
//                     style={{
//                         width: 40, height: 40, borderRadius: 12, border: "none",
//                         background: isRecording ? "#ef4444" : "#e2e8f0",
//                         color: isRecording ? "white" : "#64748b",
//                         fontSize: 18, cursor: (isProcessing || isThinking) ? "not-allowed" : "pointer",
//                         flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
//                         animation: isRecording ? "micPulse 1s infinite" : "none",
//                         transition: "background 0.2s, color 0.2s",
//                         opacity: (isProcessing || isThinking) ? 0.5 : 1,
//                     }}
//                 >
//                     {isProcessing ? "⚙️" : isRecording ? "⏹" : "🎙️"}
//                 </button>

//                 {/* Gönder */}
//                 <button
//                     onClick={() => handleSend()}
//                     disabled={!input.trim() || isBusy}
//                     style={{
//                         width: 40, height: 40, borderRadius: 12, border: "none",
//                         background: input.trim() && !isBusy ? "#f59e0b" : "#e2e8f0",
//                         color: "white", fontSize: 16, fontWeight: 700,
//                         cursor: input.trim() && !isBusy ? "pointer" : "default",
//                         flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
//                         transition: "background 0.2s",
//                     }}
//                 >
//                     ➤
//                 </button>
//             </div>

//             {/* Push-to-talk ipucu */}
//             <div style={{
//                 textAlign: "center", paddingBottom: 8, paddingTop: 2,
//                 fontSize: 10, color: "#94a3b8", flexShrink: 0,
//             }}>
//                 🎙️ Mikrofon butonuna basılı tut → konuş → bırak
//             </div>
//         </div>
//     );
// }

// // ════════════════════════════════════════════════════════════════════
// //  ANA BİLEŞEN
// // ════════════════════════════════════════════════════════════════════
// export default function ScenarioAssistant({ screen, shoppingList, collected, activeSection }) {
//     const [open, setOpen] = useState(false);
//     const [hasUnread, setHasUnread] = useState(true);
//     const [autoSpeak, setAutoSpeak] = useState(true);
//     const [isThinking, setIsThinking] = useState(false);
//     const [messages, setMessages] = useState([
//         {
//             role: "assistant",
//             content: "Merhaba! Ben market asistanınım. Alışveriş konusunda sana yardımcı olabilirim. Sesli sormak için mikrofon butonuna basılı tut.",
//         },
//     ]);

//     const { isRecording, isProcessing, startRecording, stopRecording } = useMicrophone();
//     const { isSpeaking, isLoadingTTS, speak, stop: stopTTS } = useTTS();

//     // İlk açılışta karşılama mesajını sesle oku
//     useEffect(() => {
//         if (open && autoSpeak) {
//             const t = setTimeout(() => speak(messages[0].content), 700);
//             return () => clearTimeout(t);
//         }
//     }, [open]);

//     // Mic: basılı tut → konuş → bırak
//     const handleMicStart = useCallback(() => {
//         stopTTS();
//         startRecording(
//             async (transcript) => {
//                 if (transcript) await handleSend(transcript);
//             },
//             (err) => console.warn("STT error:", err)
//         );
//     }, [screen, shoppingList, collected, activeSection, messages, autoSpeak]);

//     const handleMicStop = useCallback(() => {
//         stopRecording();
//     }, []);

//     async function handleSend(userText) {
//         const text = userText?.trim();
//         if (!text) return;

//         const newMessages = [...messages, { role: "user", content: text }];
//         setMessages(newMessages);
//         setIsThinking(true);
//         stopTTS();

//         try {
//             const systemPrompt = buildSystemPrompt({ screen, shoppingList, collected, activeSection });
//             const reply = await askMistral(text);
//             setMessages(prev => [...prev, { role: "assistant", content: reply }]);

//             if (autoSpeak) {
//                 setTimeout(() => speak(reply), 200);
//             }
//         }
//         catch (err) {
//             console.error("FULL ERROR:", err);

//             const errMsg =
//                 err instanceof Error
//                     ? `${err.name}: ${err.message}`
//                     : String(err);

//             alert(errMsg);

//             setMessages(prev => [
//                 ...prev,
//                 {
//                     role: "assistant",
//                     content: `Hata: ${errMsg}`,
//                 },
//             ]);
//         }
//         finally {
//             setIsThinking(false);
//         }
//     }

//     return (
//         <>
//             <style>{`
//         @keyframes dotBounce {
//           0%, 60%, 100% { transform: translateY(0); }
//           30%            { transform: translateY(-6px); }
//         }
//         @keyframes pulseRing {
//           0%   { transform: scale(1);    opacity: 0.85; }
//           100% { transform: scale(1.4);  opacity: 0;    }
//         }
//         @keyframes micPulse {
//           0%, 100% { box-shadow: 0 0 0 0   rgba(239,68,68,0.6); }
//           50%       { box-shadow: 0 0 0 8px rgba(239,68,68,0);   }
//         }
//         @keyframes statusPulse {
//           0%, 100% { opacity: 1; }
//           50%       { opacity: 0.5; }
//         }
//         @keyframes slideIn {
//           from { opacity: 0; transform: scale(0.88) translateY(14px); }
//           to   { opacity: 1; transform: scale(1)    translateY(0);    }
//         }
//       `}</style>

//             <div style={{
//                 position: "fixed", bottom: 24, right: 24, zIndex: 300,
//                 display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14,
//             }}>
//                 {open && (
//                     <div style={{ animation: "slideIn 0.22s ease" }}>
//                         <ChatPanel
//                             messages={messages}
//                             onSend={handleSend}
//                             onClose={() => { setOpen(false); stopTTS(); }}
//                             onSpeak={speak}
//                             onStopSpeak={stopTTS}
//                             isRecording={isRecording}
//                             isProcessing={isProcessing}
//                             isSpeaking={isSpeaking}
//                             isLoadingTTS={isLoadingTTS}
//                             isThinking={isThinking}
//                             onMicStart={handleMicStart}
//                             onMicStop={handleMicStop}
//                             autoSpeak={autoSpeak}
//                             onToggleAutoSpeak={() => { setAutoSpeak(v => !v); stopTTS(); }}
//                         />
//                     </div>
//                 )}

//                 <AvatarButton
//                     onClick={() => {
//                         if (open) { setOpen(false); stopTTS(); }
//                         else { setOpen(true); setHasUnread(false); }
//                     }}
//                     hasUnread={hasUnread}
//                     isOpen={open}
//                     isSpeaking={isSpeaking}
//                     isLoadingTTS={isLoadingTTS}
//                 />
//             </div>
//         </>
//     );
// }



































import { useState, useRef, useEffect, useCallback } from "react";

// ════════════════════════════════════════════════════════════════════
//  CONFIG  —  .env dosyasına ekle:
//    VITE_ANTHROPIC_API_KEY=sk-ant-...
//    VITE_OPENAI_API_KEY=sk-...
//    VITE_ELEVENLABS_API_KEY=...
//    VITE_ELEVENLABS_VOICE_ID=...   (Türkçe ses ID'si)
// ════════════════════════════════════════════════════════════════════
const CFG = {
    mistral: import.meta.env.VITE_MISTRAL_API_KEY ?? "",
    elevenlabs: import.meta.env.VITE_ELEVENLABS_API_KEY ?? "",
    voiceId: import.meta.env.VITE_ELEVENLABS_VOICE_ID ?? "pNInz6obpgDQGcFmaJgB",
    // ↑ varsayılan: Adam (ElevenLabs demo sesi). Türkçe için özel bir ses ID'si gir.
};

// ────────────────────────────────────────────────────────────────────
//  SYSTEM PROMPT
// ────────────────────────────────────────────────────────────────────
function buildSystemPrompt({ screen, shoppingList, collected, activeSection }) {
    const remaining = shoppingList.filter(i => !collected.includes(i.id));
    const done = shoppingList.filter(i => collected.includes(i.id));
    const loc = {
        overview: "market girişi — bölüm seçim ekranı",
        bakery: "fırın reyonu",
        dairy: "süt ve süt ürünleri reyonu",
        fruits: "meyve ve sebze reyonu",
        kasa: "kasa — ödeme ekranı",
    };
    const currentLocation = screen === "shelf"
        ? (loc[activeSection] ?? activeSection)
        : (loc[screen] ?? screen);

    return `Sen "Hayat Kolay" uygulamasında bir market alışveriş asistanısın. Otizmli bireylerin gerçek hayat senaryolarını öğrenmesine yardım ediyorsun.

KURAL — SADECE ŞUNLARDA YARDIM ET:
- Alışveriş listesindeki ürünleri bulmak ve hangi reyon olduğunu söylemek
- Market bölümlerini tanıtmak (fırın, süt ürünleri, meyve & sebze, kasa)
- Ödeme yöntemleri (kart veya nakit nasıl yapılır)
- Alışveriş sırası ve adımları
- Sosyal beceriler: kasiyere selam vermek, teşekkür etmek vb.

Bunların dışında konu gelirse kibarca reddet ve alışverişe yönlendir.

MEVCUT DURUM:
Konum         : ${currentLocation}
Alışveriş listesi : ${shoppingList.map(i => i.name).join(", ")}
Alınan ürünler    : ${done.length > 0 ? done.map(i => i.name).join(", ") : "henüz yok"}
Kalan ürünler     : ${remaining.length > 0
            ? remaining.map(i => `${i.name} (${i.section === "dairy" ? "süt ürünleri" :
                i.section === "fruits" ? "meyve & sebze" : "fırın"} reyonunda)`).join(", ")
            : "tümü alındı — kasaya gidebilirsin!"}

CEVAP STİLİ:
- Kısa ve sade (max 2-3 cümle)
- Sıcak, cesaretlendirici ton
- Türkçe cevap ver
- Sesle okunacak; emoji veya özel karakter kullanma`;
}

// ════════════════════════════════════════════════════════════════════
//  API CALLS
// ════════════════════════════════════════════════════════════════════

// ── 1. STT: Whisper ──────────────────────────────────────────────────
// ── 1. STT: ElevenLabs ─────────────────────────────────────────────
async function transcribeWithElevenLabs(audioBlob) {
    const form = new FormData();

    form.append("file", audioBlob, "recording.webm");
    form.append("model_id", "scribe_v1"); // ElevenLabs STT modeli
    form.append("language_code", "tur");  // Türkçe

    const res = await fetch(
        "https://api.elevenlabs.io/v1/speech-to-text",
        {
            method: "POST",
            headers: {
                "xi-api-key": CFG.elevenlabs,
            },
            body: form,
        }
    );

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`ElevenLabs STT error: ${res.status} ${errText}`);
    }

    const data = await res.json();

    return data.text?.trim() ?? "";
}

// ── 2. LLM: Mistral   ──────────────────────────────────────────
async function askMistral(message) {
  const res = await fetch(
    "https://api.mistral.ai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CFG.mistral}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",

        messages: [
          {
            role: "system",
            content:
              "Sen bir AVM içindeki yardımcı sesli asistansın. Türkçe konuş. Kısa, doğal ve net cevap ver.",
          },
          {
            role: "user",
            content: message,
          },
        ],

        temperature: 0.7,
      }),
    }
  );

  const text = await res.text();

  console.log("Mistral raw:", text);

  if (!res.ok) {
    throw new Error(
      `Mistral error ${res.status}: ${text}`
    );
  }

  const data = JSON.parse(text);

  return (
    data.choices?.[0]?.message?.content?.trim() ??
    ""
  );
}

// ── 3. TTS: ElevenLabs ───────────────────────────────────────────────
async function speakWithElevenLabs(text, voiceId) {
    const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
        {
            method: "POST",
            headers: {
                "xi-api-key": CFG.elevenlabs,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text,
                model_id: "eleven_multilingual_v2",   // Türkçe destekler
                voice_settings: { stability: 0.55, similarity_boost: 0.80, style: 0.20 },
            }),
        }
    );
    if (!res.ok) throw new Error(`ElevenLabs error: ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    return url; // <audio> src'e ver ya da doğrudan oynat
}

// ════════════════════════════════════════════════════════════════════
//  HOOKS
// ════════════════════════════════════════════════════════════════════

// ── Mikrofon kaydı ────────────────────────────────────────────────────
function useMicrophone() {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);  // Whisper bekliyor
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    const startRecording = useCallback(async (onTranscript, onError) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Desteklenen format seç
            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : MediaRecorder.isTypeSupported("audio/webm")
                    ? "audio/webm"
                    : "audio/ogg";

            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = e => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                setIsRecording(false);
                setIsProcessing(true);
                try {
                    const blob = new Blob(chunksRef.current, { type: mimeType });
                    const transcript = await transcribeWithElevenLabs(blob);
                    onTranscript(transcript);
                } catch (err) {
                    onError?.(err.message);
                } finally {
                    setIsProcessing(false);
                }
            };

            recorder.start();
            setIsRecording(true);
        } catch (err) {
            onError?.(err.message);
        }
    }, []);

    const stopRecording = useCallback(() => {
        mediaRecorderRef.current?.stop();
    }, []);

    return { isRecording, isProcessing, startRecording, stopRecording };
}

// ── ElevenLabs TTS oynatıcı ───────────────────────────────────────────
function useTTS() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoadingTTS, setIsLoadingTTS] = useState(false);
    const audioRef = useRef(null);

    const speak = useCallback(async (text) => {
        // Öncekini durdur
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setIsLoadingTTS(true);
        try {
            const url = await speakWithElevenLabs(text, CFG.voiceId);
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onplay = () => { setIsSpeaking(true); setIsLoadingTTS(false); };
            audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
            audio.onerror = () => { setIsSpeaking(false); setIsLoadingTTS(false); };
            await audio.play();
        } catch (err) {
            console.error("TTS error:", err);
            setIsLoadingTTS(false);
        }
    }, []);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setIsSpeaking(false);
        setIsLoadingTTS(false);
    }, []);

    return { isSpeaking, isLoadingTTS, speak, stop };
}

// ════════════════════════════════════════════════════════════════════
//  UI BİLEŞENLERİ
// ════════════════════════════════════════════════════════════════════

function AvatarButton({ onClick, hasUnread, isOpen, isSpeaking, isLoadingTTS }) {
    return (
        <button
            onClick={onClick}
            style={{
                position: "relative", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 4, background: "none", border: "none",
                cursor: "pointer", padding: 0, transition: "transform 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
            title="Yardım Al"
        >
            {/* Konuşma halkası */}
            {(isSpeaking || isLoadingTTS) && (
                <div style={{
                    position: "absolute", inset: -7, borderRadius: "50%",
                    border: `3px solid ${isLoadingTTS ? "#94a3b8" : "#f59e0b"}`,
                    animation: "pulseRing 1s ease-out infinite",
                }} />
            )}

            <div style={{
                width: 108, height: 108, borderRadius: "50%",
                background: isOpen
                    ? "linear-gradient(135deg, #f59e0b, #f97316)"
                    : "linear-gradient(135deg, #fbbf24, #fb923c)",
                border: "3px solid white",
                boxShadow: "0 4px 18px rgba(0,0,0,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 48, transition: "all 0.2s",
            }}>
                🧑
            </div>

            {hasUnread && !isOpen && (
                <div style={{
                    position: "absolute", top: 0, right: 0,
                    width: 14, height: 14, borderRadius: "50%",
                    background: "#ef4444", border: "2px solid white",
                }} />
            )}

            <span style={{
                fontSize: 10, fontWeight: 700, color: "white",
                background: "rgba(0,0,0,0.55)", borderRadius: 6,
                padding: "1px 6px", whiteSpace: "nowrap",
            }}>
                Yardım
            </span>
        </button>
    );
}

// ── Durum çubuğu (header alt kısmı) ──────────────────────────────────
function StatusBar({ isRecording, isProcessing, isSpeaking, isLoadingTTS, isThinking }) {
    if (isRecording) return <Bar color="#ef4444" icon="🎙️" text="Seni dinliyorum..." pulse />;
    if (isProcessing) return <Bar color="#8b5cf6" icon="⚙️" text="Ses işleniyor..." />;
    if (isThinking) return <Bar color="#2563eb" icon="💭" text="Düşünüyorum..." />;
    if (isLoadingTTS) return <Bar color="#64748b" icon="🔊" text="Ses hazırlanıyor..." />;
    if (isSpeaking) return <Bar color="#f59e0b" icon="🔊" text="Konuşuyor..." pulse />;
    return <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>Sana yardımcı olmaya hazır</span>;
}
function Bar({ color, icon, text, pulse }) {
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            color: "white", fontSize: 11, fontWeight: 600,
            animation: pulse ? "statusPulse 1.2s infinite" : "none",
        }}>
            <span style={{ fontSize: 13 }}>{icon}</span>{text}
        </span>
    );
}

// ── Chat paneli ────────────────────────────────────────────────────────
function ChatPanel({
    messages, onSend, onClose,
    onSpeak, onStopSpeak,
    isRecording, isProcessing, isSpeaking, isLoadingTTS, isThinking,
    onMicStart, onMicStop,
    autoSpeak, onToggleAutoSpeak,
}) {
    const [input, setInput] = useState("");
    const bottomRef = useRef(null);
    const isBusy = isRecording || isProcessing || isThinking || isLoadingTTS;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isThinking, isSpeaking]);

    const QUICK = [
        "Nereden başlamalıyım?",
        "Hangi ürünleri almam lazım?",
        "Şu an neredeyim?",
        "Kasada ne yapmalıyım?",
    ];

    function handleSend(text) {
        const msg = (text ?? input).trim();
        if (!msg || isBusy) return;
        setInput("");
        onSend(msg);
    }

    return (
        <div style={{
            width: 340, height: 510,
            background: "white", borderRadius: 22,
            boxShadow: "0 16px 56px rgba(0,0,0,0.55)",
            display: "flex", flexDirection: "column", overflow: "hidden",
        }}>

            {/* Header */}
            <div style={{
                background: "linear-gradient(135deg, #f59e0b, #f97316)",
                padding: "12px 16px", flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 26 }}>🧑‍🏫</span>
                        <div>
                            <div style={{ color: "white", fontWeight: 800, fontSize: 14 }}>Market Asistanı</div>
                            <StatusBar
                                isRecording={isRecording} isProcessing={isProcessing}
                                isSpeaking={isSpeaking} isLoadingTTS={isLoadingTTS}
                                isThinking={isThinking}
                            />
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {/* Otomatik sesli yanıt toggle */}
                        <button
                            onClick={onToggleAutoSpeak}
                            title={autoSpeak ? "Sesli yanıtı kapat" : "Sesli yanıtı aç"}
                            style={{
                                width: 32, height: 32, borderRadius: "50%", border: "none",
                                background: autoSpeak ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)",
                                cursor: "pointer", fontSize: 15,
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                        >
                            {autoSpeak ? "🔊" : "🔇"}
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                color: "white", fontSize: 20, fontWeight: 700,
                                background: "none", border: "none", cursor: "pointer", lineHeight: 1,
                            }}
                        >✕</button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1, overflowY: "auto", padding: 12,
                background: "#f8fafc", display: "flex", flexDirection: "column", gap: 8,
            }}>
                {messages.map((m, i) => (
                    <div key={i} style={{
                        display: "flex",
                        justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                        alignItems: "flex-end", gap: 6,
                    }}>
                        {m.role === "assistant" && <span style={{ fontSize: 18, flexShrink: 0 }}>🧑‍🏫</span>}
                        <div style={{
                            maxWidth: "78%", padding: "9px 13px", borderRadius: 14,
                            fontSize: 13, lineHeight: 1.55,
                            background: m.role === "user" ? "#f59e0b" : "white",
                            color: m.role === "user" ? "white" : "#1e293b",
                            boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
                            borderBottomRightRadius: m.role === "user" ? 4 : 14,
                            borderBottomLeftRadius: m.role === "user" ? 14 : 4,
                        }}>
                            {m.content}
                        </div>
                        {/* Tekrar dinle butonu */}
                        {m.role === "assistant" && (
                            <button
                                onClick={() => isSpeaking ? onStopSpeak() : onSpeak(m.content)}
                                style={{
                                    background: "none", border: "none", cursor: "pointer",
                                    fontSize: 14, opacity: 0.55, flexShrink: 0, padding: 2,
                                    transition: "opacity 0.15s",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = "0.55"; }}
                                title="Tekrar dinle"
                            >
                                {isSpeaking ? "⏹" : "▶"}
                            </button>
                        )}
                    </div>
                ))}

                {/* Thinking indicator */}
                {isThinking && (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                        <span style={{ fontSize: 18 }}>🧑‍🏫</span>
                        <div style={{
                            background: "white", borderRadius: 14, padding: "10px 14px",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                        }}>
                            <div style={{ display: "flex", gap: 4 }}>
                                {[0, 1, 2].map(n => (
                                    <div key={n} style={{
                                        width: 7, height: 7, borderRadius: "50%", background: "#94a3b8",
                                        animation: `dotBounce 1.2s infinite ${n * 0.2}s`,
                                    }} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Hızlı sorular */}
            {messages.length <= 1 && (
                <div style={{
                    padding: "6px 12px", display: "flex", flexWrap: "wrap", gap: 6,
                    flexShrink: 0, background: "white", borderTop: "1px solid #f1f5f9",
                }}>
                    {QUICK.map(q => (
                        <button key={q} onClick={() => handleSend(q)} style={{
                            fontSize: 11, padding: "5px 10px", borderRadius: 20,
                            background: "#fef3c7", color: "#92400e",
                            border: "1px solid #fde68a", fontWeight: 600, cursor: "pointer",
                        }}>
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div style={{
                padding: "10px 12px", borderTop: "1px solid #e2e8f0",
                display: "flex", gap: 8, flexShrink: 0, background: "white",
            }}>
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    placeholder={
                        isRecording ? "Dinleniyor..." :
                            isProcessing ? "İşleniyor..." :
                                isThinking ? "Yanıt geliyor..." :
                                    "Mesaj yaz..."
                    }
                    disabled={isBusy}
                    style={{
                        flex: 1, borderRadius: 12, border: "1.5px solid #e2e8f0",
                        padding: "8px 12px", fontSize: 13, outline: "none",
                        background: isRecording ? "#fef3c7" : isProcessing ? "#f3e8ff" : "white",
                        transition: "background 0.2s",
                    }}
                    onFocus={e => { e.target.style.borderColor = "#f59e0b"; }}
                    onBlur={e => { e.target.style.borderColor = "#e2e8f0"; }}
                />

                {/* Mikrofon */}
                <button
                    onMouseDown={onMicStart}
                    onMouseUp={onMicStop}
                    onTouchStart={onMicStart}
                    onTouchEnd={onMicStop}
                    disabled={isProcessing || isThinking}
                    title="Basılı tut → konuş → bırak"
                    style={{
                        width: 40, height: 40, borderRadius: 12, border: "none",
                        background: isRecording ? "#ef4444" : "#e2e8f0",
                        color: isRecording ? "white" : "#64748b",
                        fontSize: 18, cursor: (isProcessing || isThinking) ? "not-allowed" : "pointer",
                        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                        animation: isRecording ? "micPulse 1s infinite" : "none",
                        transition: "background 0.2s, color 0.2s",
                        opacity: (isProcessing || isThinking) ? 0.5 : 1,
                    }}
                >
                    {isProcessing ? "⚙️" : isRecording ? "⏹" : "🎙️"}
                </button>

                {/* Gönder */}
                <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isBusy}
                    style={{
                        width: 40, height: 40, borderRadius: 12, border: "none",
                        background: input.trim() && !isBusy ? "#f59e0b" : "#e2e8f0",
                        color: "white", fontSize: 16, fontWeight: 700,
                        cursor: input.trim() && !isBusy ? "pointer" : "default",
                        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background 0.2s",
                    }}
                >
                    ➤
                </button>
            </div>

            {/* Push-to-talk ipucu */}
            <div style={{
                textAlign: "center", paddingBottom: 8, paddingTop: 2,
                fontSize: 10, color: "#94a3b8", flexShrink: 0,
            }}>
                🎙️ Mikrofon butonuna basılı tut → konuş → bırak
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════
//  ANA BİLEŞEN
// ════════════════════════════════════════════════════════════════════
export default function ScenarioAssistant({ screen, shoppingList, collected, activeSection }) {
    const [open, setOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);
    const [autoSpeak, setAutoSpeak] = useState(true);
    const [isThinking, setIsThinking] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "Merhaba! Ben market asistanınım. Alışveriş konusunda sana yardımcı olabilirim. Sesli sormak için mikrofon butonuna basılı tut.",
        },
    ]);

    const { isRecording, isProcessing, startRecording, stopRecording } = useMicrophone();
    const { isSpeaking, isLoadingTTS, speak, stop: stopTTS } = useTTS();

    // İlk açılışta karşılama mesajını sesle oku
    useEffect(() => {
        if (open && autoSpeak) {
            const t = setTimeout(() => speak(messages[0].content), 700);
            return () => clearTimeout(t);
        }
    }, [open]);

    // Mic: basılı tut → konuş → bırak
    const handleMicStart = useCallback(() => {
        stopTTS();
        startRecording(
            async (transcript) => {
                if (transcript) await handleSend(transcript);
            },
            (err) => console.warn("STT error:", err)
        );
    }, [screen, shoppingList, collected, activeSection, messages, autoSpeak]);

    const handleMicStop = useCallback(() => {
        stopRecording();
    }, []);

    async function handleSend(userText) {
        const text = userText?.trim();
        if (!text) return;

        const newMessages = [...messages, { role: "user", content: text }];
        setMessages(newMessages);
        setIsThinking(true);
        stopTTS();

        try {
            const systemPrompt = buildSystemPrompt({ screen, shoppingList, collected, activeSection });
            const reply = await askMistral(text);
            setMessages(prev => [...prev, { role: "assistant", content: reply }]);

            if (autoSpeak) {
                setTimeout(() => speak(reply), 200);
            }
        }
        catch (err) {
            console.error("FULL ERROR:", err);

            const errMsg =
                err instanceof Error
                    ? `${err.name}: ${err.message}`
                    : String(err);

            alert(errMsg);

            setMessages(prev => [
                ...prev,
                {
                    role: "assistant",
                    content: `Hata: ${errMsg}`,
                },
            ]);
        }
        finally {
            setIsThinking(false);
        }
    }

    return (
        <>
            <style>{`
        @keyframes dotBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%            { transform: translateY(-6px); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1);    opacity: 0.85; }
          100% { transform: scale(1.4);  opacity: 0;    }
        }
        @keyframes micPulse {
          0%, 100% { box-shadow: 0 0 0 0   rgba(239,68,68,0.6); }
          50%       { box-shadow: 0 0 0 8px rgba(239,68,68,0);   }
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: scale(0.88) translateY(14px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>

            <div style={{
                position: "fixed", bottom: 24, right: 24, zIndex: 300,
                display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14,
            }}>
                {open && (
                    <div style={{ animation: "slideIn 0.22s ease" }}>
                        <ChatPanel
                            messages={messages}
                            onSend={handleSend}
                            onClose={() => { setOpen(false); stopTTS(); }}
                            onSpeak={speak}
                            onStopSpeak={stopTTS}
                            isRecording={isRecording}
                            isProcessing={isProcessing}
                            isSpeaking={isSpeaking}
                            isLoadingTTS={isLoadingTTS}
                            isThinking={isThinking}
                            onMicStart={handleMicStart}
                            onMicStop={handleMicStop}
                            autoSpeak={autoSpeak}
                            onToggleAutoSpeak={() => { setAutoSpeak(v => !v); stopTTS(); }}
                        />
                    </div>
                )}

                <AvatarButton
                    onClick={() => {
                        if (open) { setOpen(false); stopTTS(); }
                        else { setOpen(true); setHasUnread(false); }
                    }}
                    hasUnread={hasUnread}
                    isOpen={open}
                    isSpeaking={isSpeaking}
                    isLoadingTTS={isLoadingTTS}
                />
            </div>
        </>
    );
}