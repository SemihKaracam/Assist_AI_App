import { useState, useEffect, useRef, useCallback } from "react";
import FocusTracker from "../components/FocusTracker";
// ─── Asset imports ────────────────────────────────────────────────────────────
import imgOverview from "../assets/alisveris_merkezi.png";
import imgFruits from "../assets/meyve_sebze.png";
import imgBakery from "../assets/firin.png";
import imgDairy from "../assets/sut_urunleri.png";
import imgKasa from "../assets/kasa.png";

const IMG = { overview: imgOverview, fruits: imgFruits, bakery: imgBakery, dairy: imgDairy, kasa: imgKasa };

// ─── Ürün havuzları ───────────────────────────────────────────────────────────
const BAKERY_POOL = [
  { id: "simit", name: "Simit", emoji: "🥯" },
  { id: "pogaca", name: "Poğaça", emoji: "🥐" },
  { id: "kruvasan", name: "Kruvasan", emoji: "🥐" },
  { id: "donut", name: "Çikolatalı Donut", emoji: "🍩" },
  { id: "baget", name: "Baget Ekmek", emoji: "🥖" },
  { id: "tam_bugday", name: "Tam Buğday Ekmek", emoji: "🍞" },
  { id: "borek", name: "Börek", emoji: "🥙" },
  { id: "kurabiye", name: "Kurabiye", emoji: "🍪" },
];
const DAIRY_POOL = [
  { id: "sut", name: "Süt", emoji: "🥛" },
  { id: "kasar", name: "Kaşar Peyniri", emoji: "🧀" },
  { id: "yogurt", name: "Yoğurt", emoji: "🫙" },
  { id: "beyaz_peynir", name: "Beyaz Peynir", emoji: "🧀" },
  { id: "labne", name: "Labne Peynir", emoji: "🥛" },
  { id: "tereyagi", name: "Tereyağı", emoji: "🧈" },
];
const FRUITS_POOL = [
  { id: "elma", name: "Elma", emoji: "🍎" },
  { id: "armut", name: "Armut", emoji: "🍐" },
  { id: "muz", name: "Muz", emoji: "🍌" },
  { id: "domates", name: "Domates", emoji: "🍅" },
  { id: "havuc", name: "Havuç", emoji: "🥕" },
  { id: "biber", name: "Biber", emoji: "🫑" },
  { id: "lahana", name: "Lahana", emoji: "🥬" },
  { id: "portakal", name: "Portakal", emoji: "🍊" },
];
const POOL_MAP = { bakery: BAKERY_POOL, dairy: DAIRY_POOL, fruits: FRUITS_POOL };

const SECTIONS = [
  { id: "dairy", label: "Süt Ürünleri", emoji: "🥛", color: "#2563eb" },
  { id: "fruits", label: "Meyve & Sebze", emoji: "🍎", color: "#16a34a" },
  { id: "bakery", label: "Fırın", emoji: "🥖", color: "#d97706" },
  { id: "kasa", label: "Kasa", emoji: "🧾", color: "#7c3aed" },
];

function pickRandom(arr, n) { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }

function generateShoppingList() {
  return [
    ...pickRandom(DAIRY_POOL, 1).map(p => ({ ...p, section: "dairy" })),
    ...pickRandom(FRUITS_POOL, 2).map(p => ({ ...p, section: "fruits" })),
    ...pickRandom(BAKERY_POOL, 1).map(p => ({ ...p, section: "bakery" })),
  ];
}

// Rafta listenin ürünleri + rastgele sahte ürünler karışık
function getShelfProducts(sectionId, shoppingList) {
  const pool = POOL_MAP[sectionId] ?? [];
  const needed = shoppingList.filter(i => i.section === sectionId);
  const neededIds = needed.map(i => i.id);
  const extras = pickRandom(pool.filter(p => !neededIds.includes(p.id)), 4);
  return [...needed, ...extras].sort(() => Math.random() - 0.5);
}

function formatTime(s) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }

// ════════════════════════════════════════════════════════════════════
//  CONFIG
// ════════════════════════════════════════════════════════════════════
const CFG = {
  mistral: import.meta.env.VITE_MISTRAL_API_KEY ?? "",
  elevenlabs: import.meta.env.VITE_ELEVENLABS_API_KEY ?? "",
  voiceId: import.meta.env.VITE_ELEVENLABS_VOICE_ID ?? "pNInz6obpgDQGcFmaJgB",
};

// ════════════════════════════════════════════════════════════════════
//  API
// ════════════════════════════════════════════════════════════════════
async function sttElevenLabs(blob) {
  const form = new FormData();
  form.append("file", blob, "rec.webm");
  form.append("model_id", "scribe_v1");
  form.append("language_code", "tur");
  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST", headers: { "xi-api-key": CFG.elevenlabs }, body: form,
  });
  if (!res.ok) throw new Error(`STT ${res.status}`);
  return (await res.json()).text?.trim() ?? "";
}

async function llmMistral(systemPrompt, history) {
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${CFG.mistral}` },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [{ role: "system", content: systemPrompt }, ...history],
      temperature: 0.6,
      max_tokens: 90,
    }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}`);
  return (await res.json()).choices?.[0]?.message?.content?.trim() ?? "";
}

async function ttsElevenLabs(text) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${CFG.voiceId}/stream`, {
    method: "POST",
    headers: { "xi-api-key": CFG.elevenlabs, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.55, similarity_boost: 0.80, style: 0.20 },
    }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}`);
  return URL.createObjectURL(await res.blob());
}

// ════════════════════════════════════════════════════════════════════
//  SİSTEM PROMPTU — Görevli listeyi ASLA bilmez
// ════════════════════════════════════════════════════════════════════
function buildPrompt(screen, activeSection) {
  const locationMap = {
    overview: "market girişi / genel koridor",
    dairy: "süt ürünleri reyonu",
    fruits: "meyve ve sebze reyonu",
    bakery: "fırın reyonu",
    kasa: "kasa",
  };
  const location = screen === "shelf"
    ? (locationMap[activeSection] ?? "reyon")
    : (locationMap[screen] ?? "market");

  return `Sen bir marketteki görevlisin. Müşterilerle yüz yüze konuşuyorsun.

ÖNEMLİ KURALLAR:
1. Müşterinin alışveriş listesini KESİNLİKLE bilmiyorsun. Müşteri sana söylemedikçe ne aradığını bilemezsin.
2. Müşteri sana bir ürün veya reyon sorduğunda, o ürünün veya reyonun nerede olduğunu, nasıl bulunacağını açıkla.
3. Kısa ve net konuş — en fazla 2 cümle. Bu sesli bir konuşma.
4. Türkçe konuş, emoji veya özel karakter kullanma.
5. Sadece market ve alışveriş hakkında konuş.
6. Samimi ve yardımsever ol, gerçek bir market görevlisi gibi davran.
7. Eğer müşteri sana ne aradığını söylemezse, "Size nasıl yardımcı olabilirim?" diye sor.

MEVCUT KONUM: Müşteri şu an ${location} içinde.

Bu markette reyonlar şunlardır: Süt Ürünleri (A koridoru), Meyve ve Sebze (giriş karşısı), Fırın (B koridoru sonu), Kasa (çıkışta).`;
}

// ════════════════════════════════════════════════════════════════════
//  MİKROFON HOOK
// ════════════════════════════════════════════════════════════════════
function useMic() {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const recRef = useRef(null);
  const chunks = useRef([]);

  const start = useCallback(async (onResult, onErr) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus" : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      recRef.current = rec;
      chunks.current = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setRecording(false);
        setProcessing(true);
        try {
          const blob = new Blob(chunks.current, { type: mime });
          onResult(await sttElevenLabs(blob));
        } catch (e) { onErr?.(e.message); }
        finally { setProcessing(false); }
      };
      rec.start();
      setRecording(true);
    } catch (e) { onErr?.(e.message); }
  }, []);

  const stop = useCallback(() => { recRef.current?.stop(); }, []);
  return { recording, processing, start, stop };
}

// ════════════════════════════════════════════════════════════════════
//  TTS HOOK
// ════════════════════════════════════════════════════════════════════
function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [loadingTTS, setLoadingTTS] = useState(false);
  const audioRef = useRef(null);

  const speak = useCallback(async (text) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setLoadingTTS(true);
    try {
      const url = await ttsElevenLabs(text);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => { setSpeaking(true); setLoadingTTS(false); };
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setSpeaking(false); setLoadingTTS(false); };
      await audio.play();
    } catch (e) { console.error("TTS:", e); setLoadingTTS(false); }
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeaking(false);
    setLoadingTTS(false);
  }, []);

  return { speaking, loadingTTS, speak, stop };
}

// ════════════════════════════════════════════════════════════════════
//  ALIŞVERİŞ LİSTESİ — kullanıcının cebindeki not (köşede küçük)
// ════════════════════════════════════════════════════════════════════
function MyList({ shoppingList, collected, visible, onToggle }) {
  return (
    <div style={{ position: "absolute", left: 12, bottom: 12, zIndex: 20 }}>
      <button
        onClick={onToggle}
        style={{
          padding: "8px 14px",
          borderRadius: 20,
          background: "rgba(0,0,0,0.75)",
          border: "1.5px solid rgba(255,255,255,0.25)",
          color: "white",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        📋 Listem {visible ? "▾" : "▸"}
      </button>

      {visible && (
        <div style={{
          position: "absolute",
          bottom: 44,
          left: 0,
          background: "rgba(15,23,42,0.95)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 16,
          padding: "14px 16px",
          minWidth: 200,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          backdropFilter: "blur(12px)",
          animation: "fadeUp .2s ease",
        }}>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, marginBottom: 10, letterSpacing: ".5px" }}>
            ALIŞVERİŞ LİSTEM
          </div>
          {shoppingList.map(item => {
            const done = collected.includes(item.id);
            return (
              <div key={item.id} style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 0",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <span style={{ fontSize: 18 }}>{item.emoji}</span>
                <span style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: done ? "#4ade80" : "rgba(255,255,255,0.85)",
                  textDecoration: done ? "line-through" : "none",
                  flex: 1,
                }}>
                  {item.name}
                </span>
                {done && <span style={{ fontSize: 14 }}>✅</span>}
              </div>
            );
          })}
          <div style={{
            marginTop: 10,
            fontSize: 11,
            color: "rgba(255,255,255,0.3)",
            textAlign: "center",
          }}>
            {collected.length}/{shoppingList.length} ürün alındı
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  GÖREVLÎ PANELİ — sağda sabit, konuşmak için bas-bırak
//  Görevli konuşurken/dinlerken ekranın geri kalanı KİLİTLİ
// ════════════════════════════════════════════════════════════════════
function StaffPanel({
  speaking, loadingTTS, recording, processing, thinking,
  lastMessage, userTranscript,
  onMicDown, onMicUp,
}) {
  const busy = speaking || loadingTTS || recording || processing || thinking;

  const statusText =
    recording ? "Sizi dinliyorum..." :
      processing ? "Anlıyorum..." :
        thinking ? "Düşünüyorum..." :
          loadingTTS ? "Cevap hazırlanıyor..." :
            speaking ? "Konuşuyorum..." :
              "Sormak için basılı tut";

  const faceEmoji =
    recording ? "🎙️" :
      speaking ? "🗣️" :
        (thinking || processing || loadingTTS) ? "💭" : "🧑‍💼";

  const ringColor = recording ? "#ef4444" : speaking ? "#f59e0b" : "transparent";

  return (
    <div style={{
      position: "absolute",
      right: 0, top: 0, bottom: 0,
      width: "clamp(165px, 21vw, 230px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: 20,
      gap: 12,
      background: "linear-gradient(180deg, rgba(6,10,24,0.97) 0%, rgba(6,10,24,0.93) 100%)",
      borderLeft: "1px solid rgba(255,255,255,0.07)",
      zIndex: 30,
    }}>
      {/* Rozet */}
      <div style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        padding: "4px 12px",
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}>
        <span style={{ fontSize: 10 }}>🏷️</span>
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 700 }}>Market Görevlisi</span>
      </div>

      {/* Avatar + halkalar */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {(speaking || recording) && (
          <>
            <div style={{ position: "absolute", width: 112, height: 112, borderRadius: "50%", border: `2px solid ${ringColor}`, opacity: 0.3, animation: "avRing 1.6s ease-out infinite" }} />
            <div style={{ position: "absolute", width: 90, height: 90, borderRadius: "50%", border: `2px solid ${ringColor}`, opacity: 0.5, animation: "avRing 1.6s ease-out infinite .4s" }} />
          </>
        )}
        {(loadingTTS || processing || thinking) && !speaking && !recording && (
          <div style={{ position: "absolute", width: 84, height: 84, borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#f59e0b", animation: "avSpin 0.9s linear infinite" }} />
        )}
        <div style={{
          width: 70, height: 70, borderRadius: "50%",
          background: recording
            ? "linear-gradient(135deg,#ef4444,#b91c1c)"
            : speaking
              ? "linear-gradient(135deg,#f59e0b,#ea580c)"
              : "linear-gradient(135deg,#1e3a8a,#3b82f6)",
          border: "3px solid rgba(255,255,255,0.88)",
          boxShadow: speaking ? "0 0 28px rgba(245,158,11,.65)" : recording ? "0 0 28px rgba(239,68,68,.65)" : "0 4px 20px rgba(0,0,0,.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 30, transition: "all .3s",
        }}>
          {faceEmoji}
        </div>
      </div>

      {/* Ses dalgası */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, height: 18 }}>
        {[3, 5, 8, 5, 10, 5, 8, 5, 3].map((h, i) => (
          <div key={i} style={{
            width: 3, borderRadius: 2,
            background: speaking ? "#f59e0b" : recording ? "#ef4444" : "rgba(255,255,255,0.12)",
            height: (speaking || recording) ? `${h * 2}px` : "3px",
            animation: (speaking || recording) ? `avWave 0.9s ease-in-out infinite ${i * 0.08}s` : "none",
            transition: "height .3s ease, background .3s",
          }} />
        ))}
      </div>

      {/* Durum yazısı */}
      <div style={{
        color: recording ? "#fca5a5" : speaking ? "#fde68a" : "rgba(255,255,255,0.45)",
        fontSize: 10, fontWeight: 600, textAlign: "center",
        lineHeight: 1.4, minHeight: 24, padding: "0 10px",
        animation: busy ? "avPulse 1.5s infinite" : "none",
      }}>
        {statusText}
      </div>

      {/* Son söylenen mesaj */}
      {lastMessage && (
        <div style={{
          margin: "0 10px",
          padding: "10px 12px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 12,
          color: "rgba(255,255,255,0.8)",
          fontSize: 11, lineHeight: 1.55,
          maxHeight: 110, overflowY: "auto",
          animation: "fadeUp .25s ease",
        }}>
          {lastMessage}
        </div>
      )}

      {/* Kullanıcının söylediği */}
      {userTranscript && (
        <div style={{
          margin: "0 10px",
          padding: "8px 12px",
          background: "rgba(245,158,11,0.1)",
          border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: 12,
          color: "#fde68a",
          fontSize: 10, lineHeight: 1.4,
          animation: "fadeUp .2s ease",
        }}>
          🗣️ {userTranscript}
        </div>
      )}

      {/* Kilit uyarısı — görevli konuşurken */}
      {busy && !recording && (
        <div style={{
          margin: "0 10px",
          padding: "6px 10px",
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 10,
          color: "#fca5a5",
          fontSize: 9, fontWeight: 700,
          textAlign: "center",
        }}>
          🔒 Görevli konuşurken bekleyin
        </div>
      )}

      {/* Mikrofon */}
      <button
        onMouseDown={onMicDown}
        onMouseUp={onMicUp}
        onTouchStart={onMicDown}
        onTouchEnd={onMicUp}
        disabled={speaking || loadingTTS || processing || thinking}
        style={{
          marginTop: "auto",
          marginBottom: 18,
          width: 54, height: 54,
          borderRadius: "50%",
          border: "none",
          background: recording
            ? "#ef4444"
            : (speaking || loadingTTS || processing || thinking)
              ? "rgba(255,255,255,0.06)"
              : "rgba(245,158,11,0.85)",
          color: "white", fontSize: 22,
          cursor: (speaking || loadingTTS || processing || thinking) ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: recording ? "0 0 0 0 rgba(239,68,68,.5)" : "0 4px 16px rgba(0,0,0,.35)",
          animation: recording ? "avMicRipple 1s infinite" : "none",
          transition: "background .2s, opacity .2s",
          opacity: (speaking || loadingTTS || processing || thinking) ? 0.35 : 1,
          flexShrink: 0,
        }}
      >
        {recording ? "⏹" : (processing || thinking || loadingTTS) ? "⏳" : "🎙️"}
      </button>

      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, textAlign: "center", margin: "0 0 8px", padding: "0 8px" }}>
        Basılı tut → konuş → bırak
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  OVERLAY KİLİDİ — görevli konuşurken tüm ekranda şeffaf bariyer
// ════════════════════════════════════════════════════════════════════
function InteractionLock({ active }) {
  if (!active) return null;
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      right: "clamp(165px, 21vw, 230px)", // görevli paneli hariç
      zIndex: 25,
      cursor: "not-allowed",
      background: "rgba(0,0,0,0.01)", // görünmez ama tıklamaları yutar
    }} />
  );
}

// ════════════════════════════════════════════════════════════════════
//  OVERVIEW EKRANI
// ════════════════════════════════════════════════════════════════════
function OverviewScreen({ shoppingList, collected, onSelectSection, locked }) {
  return (
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: `url('${IMG.overview}')`,
      backgroundSize: "cover", backgroundPosition: "center",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.42)" }} />
      <div style={{
        position: "absolute", inset: 0, zIndex: 2,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 18, padding: "20px",
      }}>
        <div style={{
          background: "rgba(0,0,0,0.65)",
          borderRadius: 18, padding: "12px 22px",
          textAlign: "center",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ color: "white", fontSize: 16, fontWeight: 800 }}>
            Hangi reyona gidiyorsun?
          </div>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 3 }}>
            Bir reyona dokunarak git • Bilmiyorsan görevliye sor →
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, width: "100%", maxWidth: 400 }}>
          {SECTIONS.map(sec => {
            const needed = shoppingList.filter(i => i.section === sec.id);
            const doneArr = needed.filter(i => collected.includes(i.id));
            const allDone = needed.length > 0 && doneArr.length === needed.length;

            return (
              <button
                key={sec.id}
                onClick={() => !locked && onSelectSection(sec.id)}
                style={{
                  padding: "18px 14px",
                  borderRadius: 18,
                  background: allDone ? "rgba(34,197,94,0.9)" : "rgba(255,255,255,0.92)",
                  border: `3px solid ${allDone ? "#22c55e" : sec.color}`,
                  boxShadow: allDone ? "0 4px 20px rgba(34,197,94,.4)" : `0 4px 20px ${sec.color}33`,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 5,
                  cursor: locked ? "not-allowed" : "pointer",
                  opacity: locked ? 0.55 : 1,
                  transition: "transform .15s, opacity .2s",
                  transform: "scale(1)",
                }}
                onMouseDown={e => { if (!locked) e.currentTarget.style.transform = "scale(0.95)"; }}
                onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                <span style={{ fontSize: 34 }}>{sec.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: allDone ? "white" : sec.color }}>
                  {sec.label}
                </span>
                {allDone && (
                  <span style={{ fontSize: 10, color: "white", fontWeight: 700, background: "rgba(255,255,255,0.25)", padding: "1px 8px", borderRadius: 10 }}>
                    ✅ Tamamlandı
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  SHELF EKRANI
// ════════════════════════════════════════════════════════════════════
function ShelfScreen({ sectionId, shoppingList, collected, onCollect, onBack, locked }) {
  const [shelfProducts] = useState(() => getShelfProducts(sectionId, shoppingList));
  const [justPicked, setJustPicked] = useState(null);
  const sec = SECTIONS.find(s => s.id === sectionId);

  function handlePick(product) {
    if (locked || collected.includes(product.id)) return;
    setJustPicked(product.id);
    onCollect(product);
    setTimeout(() => setJustPicked(null), 1000);
  }

  return (
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: `url('${IMG[sectionId]}')`,
      backgroundSize: "cover", backgroundPosition: "center",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
      <div style={{
        position: "absolute", inset: 0, zIndex: 2,
        display: "flex", flexDirection: "column",
        padding: "14px 14px 14px 14px",
      }}>
        {/* Başlık */}
        <div style={{
          background: "rgba(0,0,0,0.7)", borderRadius: 14,
          padding: "9px 16px", marginBottom: 12,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div>
            <span style={{ fontSize: 16 }}>{sec?.emoji}</span>
            <span style={{ color: "white", fontWeight: 800, fontSize: 14, marginLeft: 6 }}>{sec?.label}</span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 10 }}>
            Almak istediğin ürüne dokun
          </span>
        </div>

        {/* Ürün ızgarası */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10, flex: 1,
          alignContent: "start",
          overflowY: "auto", paddingBottom: 8,
        }}>
          {shelfProducts.map(p => {
            const isDone = collected.includes(p.id);
            const isJust = justPicked === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handlePick(p)}
                disabled={isDone || locked}
                style={{
                  padding: "12px 6px",
                  borderRadius: 16,
                  background: isDone ? "rgba(34,197,94,0.85)" : "rgba(255,255,255,0.93)",
                  border: isDone
                    ? "3px solid #22c55e"
                    : isJust
                      ? "3px solid #22c55e"
                      : "2px solid rgba(200,200,200,0.5)",
                  boxShadow: isJust
                    ? "0 0 20px rgba(34,197,94,.8)"
                    : isDone
                      ? "none"
                      : "0 2px 8px rgba(0,0,0,.3)",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 5,
                  cursor: isDone || locked ? "default" : "pointer",
                  opacity: locked && !isDone ? 0.5 : 1,
                  transform: isJust ? "scale(1.06)" : "scale(1)",
                  transition: "transform .2s, box-shadow .2s, opacity .2s",
                }}
              >
                <span style={{ fontSize: 28 }}>{isDone ? "✅" : p.emoji}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: isDone ? "white" : "#1e293b",
                  textAlign: "center", lineHeight: 1.2,
                }}>
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Geri */}
        <button
          onClick={() => !locked && onBack()}
          style={{
            marginTop: 10, padding: "10px 0",
            borderRadius: 14,
            background: locked ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.92)",
            border: "none",
            color: "#1e293b", fontWeight: 800, fontSize: 13,
            cursor: locked ? "not-allowed" : "pointer",
            flexShrink: 0,
            boxShadow: "0 4px 14px rgba(0,0,0,.3)",
            opacity: locked ? 0.5 : 1,
            transition: "opacity .2s",
          }}
        >
          ← Reyonlara Geri Dön
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  KASA EKRANI
// ════════════════════════════════════════════════════════════════════
function KasaScreen({ shoppingList, collected, onPay, onBack, locked }) {
  const [chosen, setChosen] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  function handleConfirm() {
    if (!chosen || locked) return;
    setConfirmed(true);
    setTimeout(() => onPay(chosen), 1800);
  }

  return (
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: `url('${IMG.kasa}')`,
      backgroundSize: "cover", backgroundPosition: "center",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.52)" }} />
      <div style={{
        position: "absolute", inset: 0, zIndex: 5,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}>
        <div style={{
          background: "rgba(255,255,255,0.97)", borderRadius: 24,
          padding: "26px 26px", width: "min(370px,80vw)",
          boxShadow: "0 16px 50px rgba(0,0,0,.45)",
          display: "flex", flexDirection: "column", gap: 14,
          opacity: locked ? 0.6 : 1, transition: "opacity .2s",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 38 }}>🧾</div>
            <h3 style={{ fontWeight: 800, color: "#1e293b", fontSize: 17, margin: "6px 0 2px" }}>
              Ödeme Yöntemi
            </h3>
            <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>
              Nasıl ödemek istiyorsun?
            </p>
          </div>

          {/* Sepet */}
          <div style={{ borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            {shoppingList.map(item => {
              const done = collected.includes(item.id);
              return (
                <div key={item.id} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "7px 12px", borderBottom: "1px solid #f1f5f9",
                  background: done ? "#f0fdf4" : "white",
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: done ? "#15803d" : "#64748b" }}>
                    {item.emoji} {item.name}
                  </span>
                  <span style={{ fontSize: 11, color: done ? "#16a34a" : "#94a3b8", fontWeight: 700 }}>
                    {done ? "✅ Alındı" : "Alınmadı"}
                  </span>
                </div>
              );
            })}
          </div>

          {!confirmed ? (
            <>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { id: "card", label: "Kartla Öde", emoji: "💳", color: "#2563eb" },
                  { id: "cash", label: "Nakitle Öde", emoji: "💵", color: "#16a34a" },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => !locked && setChosen(opt.id)}
                    style={{
                      flex: 1, padding: "13px 8px", borderRadius: 14,
                      background: chosen === opt.id ? opt.color : "white",
                      border: `3px solid ${opt.color}`,
                      color: chosen === opt.id ? "white" : opt.color,
                      fontWeight: 800, fontSize: 13,
                      cursor: locked ? "not-allowed" : "pointer",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 3,
                      boxShadow: chosen === opt.id ? `0 4px 14px ${opt.color}44` : "none",
                      transition: "all .2s",
                    }}
                  >
                    <span style={{ fontSize: 26 }}>{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>

              {chosen && (
                <button
                  onClick={handleConfirm}
                  style={{
                    padding: "12px", borderRadius: 13,
                    background: locked ? "#94a3b8" : "#1e293b",
                    color: "white", fontWeight: 800, fontSize: 14,
                    border: "none", cursor: locked ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(0,0,0,.25)",
                    animation: "fadeUp .2s ease",
                  }}
                >
                  ✓ Ödemeyi Onayla
                </button>
              )}

              <button
                onClick={() => !locked && onBack()}
                style={{
                  padding: "8px", borderRadius: 11,
                  background: "#f1f5f9", color: "#475569",
                  fontWeight: 700, fontSize: 12,
                  border: "none", cursor: locked ? "not-allowed" : "pointer",
                }}
              >
                ← Geri Dön
              </button>
            </>
          ) : (
            <div style={{
              textAlign: "center", padding: "18px",
              background: "#f0fdf4", borderRadius: 14,
              border: "2px solid #86efac",
              color: "#16a34a", fontWeight: 800, fontSize: 15,
              animation: "fadeUp .3s ease",
            }}>
              {chosen === "card" ? "💳 Kart okutuldu!" : "💵 Nakit ödendi!"}
              <div style={{ fontSize: 12, marginTop: 5, color: "#15803d" }}>
                Alışveriş tamamlanıyor...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  RAPOR
// ════════════════════════════════════════════════════════════════════
function ReportModal({ shoppingList, collected, elapsed, payMethod, onRestart, onHome }) {
  const correct = shoppingList.filter(i => collected.includes(i.id)).length;
  const stars = correct === 4 ? 3 : correct >= 2 ? 2 : 1;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        background: "white", borderRadius: 28, padding: "34px 30px",
        width: "min(480px,94vw)",
        boxShadow: "0 20px 60px rgba(0,0,0,.5)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
        animation: "fadeUp .35s ease",
      }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3].map(n => <span key={n} style={{ fontSize: 34, opacity: n <= stars ? 1 : 0.2 }}>⭐</span>)}
        </div>
        <h2 style={{ fontSize: 21, fontWeight: 800, color: "#1e293b", margin: 0 }}>Alışveriş Raporu</h2>
        <div style={{ display: "flex", gap: 20, width: "100%", background: "#f8fafc", borderRadius: 16, padding: 16 }}>
          {[
            { label: "Doğru Ürün", value: `${correct}/${shoppingList.length}`, color: correct === shoppingList.length ? "#16a34a" : "#f59e0b" },
            { label: "Süre", value: formatTime(elapsed), color: "#2563eb" },
            { label: "Ödeme", value: payMethod === "card" ? "💳 Kart" : "💵 Nakit", color: "#7c3aed" },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ width: "100%", borderRadius: 13, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          {shoppingList.map(item => {
            const done = collected.includes(item.id);
            return (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", borderBottom: "1px solid #f8fafc" }}>
                <span style={{ fontSize: 13, color: done ? "#16a34a" : "#ef4444", fontWeight: 600 }}>
                  {item.emoji} {item.name}
                </span>
                <span style={{ fontSize: 11, background: done ? "#dcfce7" : "#fee2e2", color: done ? "#16a34a" : "#ef4444", borderRadius: 20, padding: "2px 10px", fontWeight: 700 }}>
                  {done ? "✅ Alındı" : "❌ Alınmadı"}
                </span>
              </div>
            );
          })}
        </div>
        <p style={{ color: "#475569", fontSize: 14, fontWeight: 600, textAlign: "center", margin: 0 }}>
          {correct === 4 ? "🎉 Mükemmel! Tüm ürünleri başarıyla aldın!"
            : correct >= 2 ? "👍 Çok iyi! Biraz daha pratikle mükemmel olacaksın."
              : "💪 Devam et! Her seferinde daha iyi olacaksın."}
        </p>
        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <button onClick={onRestart} style={{ flex: 1, padding: "12px 0", borderRadius: 13, background: "#2563eb", color: "white", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer" }}>
            🔄 Tekrar Dene
          </button>
          <button onClick={onHome} style={{ flex: 1, padding: "12px 0", borderRadius: 13, background: "#475569", color: "white", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer" }}>
            🏠 Ana Sayfa
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ANA BİLEŞEN
// ════════════════════════════════════════════════════════════════════
export default function MarketScenario({ onExit }) {
  const [shoppingList, setShoppingList] = useState(() => generateShoppingList());
  const [screen, setScreen] = useState("overview");
  const [activeSection, setActiveSection] = useState(null);
  const [collected, setCollected] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [payMethod, setPayMethod] = useState(null);
  const [listVisible, setListVisible] = useState(false);

  // Diyalog
  const [messages, setMessages] = useState([]);
  const [userTranscript, setUserTranscript] = useState("");
  const [thinking, setThinking] = useState(false);
  const [lastStaffMsg, setLastStaffMsg] = useState("");

  const timerRef = useRef(null);
  const { recording, processing, start: startMic, stop: stopMic } = useMic();
  const { speaking, loadingTTS, speak, stop: stopTTS } = useTTS();

  // Görevli konuşurken ya da işlem yaparken UI kilidi
  const uiLocked = speaking || loadingTTS || recording || processing || thinking;

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Ekran değişince görevli SADECE genel karşılama yapar — listeyi bilmez
  const greetedScreens = useRef(new Set());
  useEffect(() => {
    const key = screen === "shelf" ? `shelf-${activeSection}` : screen;
    if (greetedScreens.current.has(key)) return;
    greetedScreens.current.add(key);

    const greetMap = {
      overview: "Merhaba, hoş geldiniz! Size nasıl yardımcı olabilirim?",
      "shelf-dairy": "Süt ürünleri reyonundasınız. Yardımcı olmamı ister misiniz?",
      "shelf-fruits": "Meyve ve sebze reyonundasınız. Bir şey sormak ister misiniz?",
      "shelf-bakery": "Fırın reyonundasınız. Yardımcı olmamı ister misiniz?",
      kasa: "Kasaya hoş geldiniz. Ödeme konusunda sorunuz varsa yardımcı olabilirim.",
    };
    const msg = greetMap[key];
    if (msg) setTimeout(() => staffSay(msg), 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, activeSection]);

  async function staffSay(text) {
    if (!text) return;
    stopTTS();
    setLastStaffMsg(text);
    setMessages(prev => [...prev, { role: "assistant", content: text }]);
    await speak(text);
  }

  async function handleUserInput(transcript) {
    if (!transcript?.trim()) return;
    setUserTranscript(transcript);
    const newHistory = [...messages, { role: "user", content: transcript }];
    setMessages(newHistory);
    setThinking(true);
    stopTTS();

    try {
      const prompt = buildPrompt(screen, activeSection);
      const reply = await llmMistral(prompt, newHistory.map(m => ({ role: m.role, content: m.content })));
      setLastStaffMsg(reply);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      setThinking(false);
      await speak(reply);
    } catch (e) {
      console.error("LLM:", e);
      setThinking(false);
      const err = "Özür dilerim, şu an anlayamadım. Tekrar söyler misiniz?";
      setLastStaffMsg(err);
      setMessages(prev => [...prev, { role: "assistant", content: err }]);
    } finally {
      setUserTranscript("");
    }
  }

  function handleSelectSection(sectionId) {
    if (uiLocked) return;
    if (sectionId === "kasa") {
      setScreen("kasa");
    } else {
      setActiveSection(sectionId);
      setScreen("shelf");
    }
  }

  function handleCollect(product) {
    if (uiLocked) return;
    setCollected(prev => prev.includes(product.id) ? prev : [...prev, product.id]);
  }

  function handlePay(method) {
    setPayMethod(method);
    clearInterval(timerRef.current);
    const msg = method === "card"
      ? "Kartınızla ödeme alındı, teşekkürler. İyi günler!"
      : "Nakit ödemeniz alındı, teşekkürler. İyi günler!";
    staffSay(msg);
    setTimeout(() => setScreen("done"), 2800);
  }

  function handleRestart() {
    greetedScreens.current = new Set();
    setShoppingList(generateShoppingList());
    setCollected([]); setScreen("overview"); setActiveSection(null);
    setElapsed(0); setPayMethod(null); setMessages([]);
    setUserTranscript(""); setLastStaffMsg(""); setListVisible(false);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }

  const handleMicDown = useCallback(() => {
    if (speaking || loadingTTS || processing || thinking) return;
    stopTTS();
    startMic(
      async (transcript) => { if (transcript?.trim()) await handleUserInput(transcript); },
      (err) => console.warn("MIC:", err)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, activeSection, messages, speaking, loadingTTS, processing, thinking]);

  const handleMicUp = useCallback(() => stopMic(), [stopMic]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", flexDirection: "column",
      background: "#000", fontFamily: "system-ui, sans-serif",
    }}>
      <style>{`
        @keyframes avRing      { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.55);opacity:0} }
        @keyframes avSpin      { to{transform:rotate(360deg)} }
        @keyframes avWave      { 0%,100%{transform:scaleY(.35)} 50%{transform:scaleY(1)} }
        @keyframes avPulse     { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes avMicRipple { 0%{box-shadow:0 0 0 0 rgba(239,68,68,.5)} 100%{box-shadow:0 0 0 20px rgba(239,68,68,0)} }
        @keyframes fadeUp      { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* HUD */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 14px", flexShrink: 0,
        background: "rgba(0,0,0,0.92)", borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "white", fontSize: 16 }}>🛒</span>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600 }}>
            Market Alışverişi
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ borderRadius: 20, padding: "3px 10px", fontWeight: 700, fontSize: 11, background: "rgba(255,255,255,0.08)", color: "white" }}>
            ⏱ {formatTime(elapsed)}
          </div>
          {onExit && (
            <button onClick={onExit} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", color: "white", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          )}
        </div>
      </div>

      {/* Ana alan */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

        {screen === "overview" && (
          <OverviewScreen
            shoppingList={shoppingList}
            collected={collected}
            onSelectSection={handleSelectSection}
            locked={uiLocked}
          />
        )}
        {screen === "shelf" && activeSection && (
          <ShelfScreen
            sectionId={activeSection}
            shoppingList={shoppingList}
            collected={collected}
            onCollect={handleCollect}
            onBack={() => { if (!uiLocked) { setScreen("overview"); setActiveSection(null); } }}
            locked={uiLocked}
          />
        )}
        {screen === "kasa" && (
          <KasaScreen
            shoppingList={shoppingList}
            collected={collected}
            onPay={handlePay}
            onBack={() => { if (!uiLocked) setScreen("overview"); }}
            locked={uiLocked}
          />
        )}

        {/* Ekran kilidi overlay (görevli konuşurken) */}
        <InteractionLock active={uiLocked} />

        {/* Listem butonu + popup */}
        {screen !== "done" && (
          <MyList
            shoppingList={shoppingList}
            collected={collected}
            visible={listVisible && !uiLocked}
            onToggle={() => { if (!uiLocked) setListVisible(v => !v); }}
          />
        )}
        {/* Odak Takibi — sol üst köşe */}
        {screen !== "done" && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 35,
            pointerEvents: "auto",
          }}>
            <FocusTracker />
          </div>
        )}
        {/* Görevli paneli */}
        {screen !== "done" && (
          <StaffPanel
            speaking={speaking}
            loadingTTS={loadingTTS}
            recording={recording}
            processing={processing}
            thinking={thinking}
            lastMessage={lastStaffMsg}
            userTranscript={userTranscript}
            onMicDown={handleMicDown}
            onMicUp={handleMicUp}
          />
        )}
      </div>

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
    </div>
  );
}











// import { useState, useEffect, useRef, useCallback } from "react";

// // ─── Asset imports ────────────────────────────────────────────────────────────
// import imgOverview from "../assets/alisveris_merkezi.png";

// import imgFruits   from "../assets/meyve_sebze.png";
// import imgBakery   from "../assets/firin.png";
// import imgDairy    from "../assets/sut_urunleri.png";
// import imgKasa     from "../assets/kasa.png";

// const IMG = { overview: imgOverview, fruits: imgFruits, bakery: imgBakery, dairy: imgDairy, kasa: imgKasa };

// // ════════════════════════════════════════════════════════════════════
// //  FOCUS TRACKER — MediaPipe yüz odak takibi
// // ════════════════════════════════════════════════════════════════════
// const FT_SCRIPTS = [
//   "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js",
//   "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3/drawing_utils.js",
//   "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh.js",
// ];
// function ftLoadScript(src) {
//   return new Promise((res, rej) => {
//     if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
//     const el = document.createElement("script");
//     el.src = src; el.async = false;
//     el.onload = () => res(); el.onerror = () => rej(new Error(`Yüklenemedi: ${src}`));
//     document.head.appendChild(el);
//   });
// }
// async function ftLoadAll() { for (const s of FT_SCRIPTS) await ftLoadScript(s); }
// function ftWaitFaceMesh(ms = 12000) {
//   return new Promise((res, rej) => {
//     const t0 = Date.now();
//     const poll = () => {
//       if (typeof window.FaceMesh === "function") return res(window.FaceMesh);
//       if (Date.now() - t0 > ms) return rej(new Error("FaceMesh timeout"));
//       setTimeout(poll, 120);
//     };
//     poll();
//   });
// }
// const FT_L_EYE = [362,385,387,263,373,380];
// const FT_R_EYE = [33,160,158,133,153,144];
// const FT_NOSE=1, FT_CHIN=152, FT_LTEMP=234, FT_RTEMP=454, FT_FORE=10;
// const ftDist = (a,b) => Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2);
// function ftEAR(lm, idx) {
//   const [p1,p2,p3,p4,p5,p6] = idx.map(i=>lm[i]);
//   return (ftDist(p2,p6)+ftDist(p3,p5))/(2*ftDist(p1,p4));
// }
// function ftHeadAngles(lm) {
//   const nose=lm[FT_NOSE], lt=lm[FT_LTEMP], rt=lm[FT_RTEMP], fore=lm[FT_FORE], chin=lm[FT_CHIN];
//   const tw = ftDist(lt,rt)||0.001;
//   const yaw = ((ftDist(lt,nose)/tw)-0.5)*200;
//   const noseY = (nose.y-fore.y)/((chin.y-fore.y)||0.001);
//   const pitch = (noseY-0.42)*250;
//   return { yaw, pitch };
// }
// const FT_EAR_THRESH=0.18, FT_EAR_FRAMES=50, FT_YAW=40, FT_PITCH=36, FT_NO_FACE=40;
// const FT_FILL=1.2, FT_DRAIN=0.6, FT_WARN=100, FT_COOLDOWN=7000;
// const FT_STATES = {
//   focused:      { label:"Odaklı",          color:"#22c55e", icon:"🟢" },
//   eyes_closed:  { label:"Gözler Kapalı",   color:"#f59e0b", icon:"😑" },
//   looking_away: { label:"Dikkati Dağıldı", color:"#ef4444", icon:"👀" },
//   head_turned:  { label:"Kafa Döndü",      color:"#ef4444", icon:"↩️"  },
//   no_face:      { label:"Yüz Bulunamadı",  color:"#94a3b8", icon:"❓" },
//   loading:      { label:"Yükleniyor...",   color:"#94a3b8", icon:"⏳" },
//   error:        { label:"Hata",            color:"#dc2626", icon:"⚠️" },
// };
// function ftDrawOverlay(ctx, lm, color, w, h) {
//   ctx.clearRect(0,0,w,h);
//   if (!lm) return;
//   for (const idx of [FT_L_EYE, FT_R_EYE]) {
//     ctx.beginPath();
//     idx.forEach((id,i) => { const p=lm[id]; i===0?ctx.moveTo(p.x*w,p.y*h):ctx.lineTo(p.x*w,p.y*h); });
//     ctx.closePath(); ctx.strokeStyle=color; ctx.lineWidth=1.5; ctx.stroke();
//   }
//   const n=lm[FT_NOSE];
//   ctx.beginPath(); ctx.arc(n.x*w,n.y*h,3,0,Math.PI*2); ctx.fillStyle=color; ctx.fill();
//   const {yaw,pitch}=ftHeadAngles(lm);
//   const cx=n.x*w, cy=n.y*h;
//   const dx=Math.sin((yaw/100)*(Math.PI/2))*22, dy=Math.sin((pitch/100)*(Math.PI/2))*22;
//   ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+dx,cy+dy);
//   ctx.strokeStyle=color; ctx.lineWidth=2; ctx.stroke();
//   ctx.beginPath(); ctx.arc(cx+dx,cy+dy,3,0,Math.PI*2); ctx.fillStyle=color; ctx.fill();
// }

// function FocusTracker({ onFocusChange }) {
//   const videoRef   = useRef(null);
//   const overlayRef = useRef(null);
//   const fmRef      = useRef(null);
//   const camRef     = useRef(null);

//   const [focusState,  setFocusState]  = useState("loading");
//   const [focusBar,    setFocusBar]    = useState(0);
//   const [metrics,     setMetrics]     = useState({ yaw:0, pitch:0, earL:"—", earR:"—" });
//   const [initialized, setInitialized] = useState(false);
//   const [errorMsg,    setErrorMsg]    = useState("");
//   const [minimized,   setMinimized]   = useState(false);
//   const [enabled,     setEnabled]     = useState(true);
//   const [inlineAlert, setInlineAlert] = useState({ show:false, msg:"", color:"#ef4444" });

//   const eyeClosedCnt  = useRef(0);
//   const noFaceCnt     = useRef(0);
//   const barValue      = useRef(0);
//   const prevState     = useRef("loading");
//   const lastAlertTime = useRef({});
//   const alertTimer    = useRef(null);

//   const fireAlert = useCallback((key, msg, color) => {
//     const now = Date.now();
//     if ((now-(lastAlertTime.current[key]??0)) < FT_COOLDOWN) return;
//     lastAlertTime.current[key] = now;
//     setInlineAlert({ show:true, msg, color });
//     clearTimeout(alertTimer.current);
//     alertTimer.current = setTimeout(() => setInlineAlert(a=>({...a,show:false})), 4500);
//   }, []);

//   const updateState = useCallback((next) => {
//     if (next === prevState.current) return;
//     prevState.current = next;
//     setFocusState(next);
//     onFocusChange?.(next);
//     const alerts = {
//       eyes_closed:  ["😑 Gözlerin uzun süre kapandı. Odaklanmaya devam et!", "#f59e0b"],
//       looking_away: ["👀 Ekrandan uzaklaştın. Göreve devam et!",             "#ef4444"],
//       head_turned:  ["↩️ Kafanı döndürdün. Ekrana bakabilirsin.",            "#ef4444"],
//       no_face:      ["❓ Seni göremiyorum. Kameraya yaklaş.",                 "#94a3b8"],
//     };
//     if (alerts[next]) fireAlert(next, ...alerts[next]);
//   }, [fireAlert, onFocusChange]);

//   useEffect(() => {
//     if (!enabled) return;
//     let active = true;
//     (async () => {
//       try {
//         setFocusState("loading"); setErrorMsg("");
//         await ftLoadAll();
//         if (!active) return;
//         const FaceMesh = await ftWaitFaceMesh();
//         if (!active) return;
//         const fm = new FaceMesh({
//           locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${f}`,
//         });
//         fm.setOptions({ maxNumFaces:1, refineLandmarks:true, minDetectionConfidence:0.55, minTrackingConfidence:0.55 });
//         fm.onResults((results) => {
//           if (!active) return;
//           const canvas = overlayRef.current; if (!canvas) return;
//           const ctx = canvas.getContext("2d");
//           const {width:w, height:h} = canvas;
//           const color = FT_STATES[prevState.current]?.color ?? "#94a3b8";
//           if (!results.multiFaceLandmarks?.length) {
//             noFaceCnt.current++;
//             ftDrawOverlay(ctx,null,color,w,h);
//             barValue.current = Math.max(barValue.current-FT_DRAIN,0);
//             setFocusBar(Math.round(barValue.current));
//             if (noFaceCnt.current >= FT_NO_FACE) updateState("no_face");
//             return;
//           }
//           noFaceCnt.current = 0;
//           const lm = results.multiFaceLandmarks[0];
//           const earL = ftEAR(lm, FT_L_EYE), earR = ftEAR(lm, FT_R_EYE);
//           const avg = (earL+earR)/2;
//           const {yaw, pitch} = ftHeadAngles(lm);
//           setMetrics({ yaw:Math.round(yaw), pitch:Math.round(pitch), earL:earL.toFixed(2), earR:earR.toFixed(2) });
//           ftDrawOverlay(ctx,lm,color,w,h);
//           if (avg < FT_EAR_THRESH) {
//             eyeClosedCnt.current++;
//             if (eyeClosedCnt.current >= FT_EAR_FRAMES) updateState("eyes_closed");
//           } else {
//             eyeClosedCnt.current = 0;
//           }
//           const isDistracted = Math.abs(yaw)>FT_YAW || Math.abs(pitch)>FT_PITCH;
//           barValue.current = isDistracted
//             ? Math.min(barValue.current+FT_FILL, FT_WARN)
//             : Math.max(barValue.current-FT_DRAIN, 0);
//           setFocusBar(Math.round(barValue.current));
//           if (barValue.current >= FT_WARN) {
//             updateState(Math.abs(yaw)>FT_YAW ? "head_turned" : "looking_away");
//           } else if (barValue.current < 10 && eyeClosedCnt.current < 5) {
//             updateState("focused");
//           }
//         });
//         fmRef.current = fm;
//         const Camera = window.Camera;
//         if (typeof Camera !== "function") throw new Error("window.Camera hazır değil");
//         const cam = new Camera(videoRef.current, {
//           onFrame: async () => {
//             if (fmRef.current && videoRef.current)
//               await fmRef.current.send({ image: videoRef.current });
//           },
//           width:240, height:180,
//         });
//         await cam.start();
//         camRef.current = cam;
//         if (active) { setInitialized(true); setFocusState("focused"); prevState.current="focused"; }
//       } catch(err) {
//         console.error("FocusTracker:", err);
//         if (active) { setFocusState("error"); setErrorMsg(err.message); }
//       }
//     })();
//     return () => {
//       active = false;
//       try { camRef.current?.stop?.(); } catch(_) {}
//       try { fmRef.current?.close?.(); } catch(_) {}
//       clearTimeout(alertTimer.current);
//     };
//   }, [enabled, updateState]);

//   const st = FT_STATES[focusState] ?? FT_STATES.loading;
//   const isFocused = focusState === "focused";
//   const barColor = focusBar>74 ? "linear-gradient(90deg,#f59e0b,#ef4444)" : focusBar>44 ? "#f59e0b" : "#22c55e";

//   // Kapalıysa sadece "Odak Takibini Aç" butonu göster
//   if (!enabled) return (
//     <div style={{ position:"absolute", top:12, left:12, zIndex:50 }}>
//       <button onClick={() => setEnabled(true)} style={{
//         padding:"6px 13px", borderRadius:12,
//         background:"rgba(0,0,0,0.72)", color:"white",
//         border:"1px solid rgba(255,255,255,0.18)",
//         fontSize:11, fontWeight:700, cursor:"pointer",
//         backdropFilter:"blur(8px)",
//       }}>
//         👁 Odak Takibi Aç
//       </button>
//     </div>
//   );

//   return (
//     <>
//       <style>{`
//         @keyframes ft-blink { 0%,100%{opacity:1} 50%{opacity:.25} }
//         @keyframes ft-spin  { to{transform:rotate(360deg)} }
//         @keyframes ft-alert { from{opacity:0;max-height:0;padding:0 10px} to{opacity:1;max-height:60px;padding:6px 10px} }
//         @keyframes ft-in    { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
//       `}</style>
//       <div style={{
//         position: "absolute",
//         top: 12, left: 12,
//         zIndex: 50,
//         width: minimized ? 44 : 220,
//         background: "rgba(8,12,26,0.94)",
//         border: `2px solid ${isFocused ? "rgba(34,197,94,0.4)" : st.color}`,
//         borderRadius: minimized ? 22 : 14,
//         overflow: "hidden",
//         boxShadow: "0 6px 28px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
//         backdropFilter: "blur(10px)",
//         transition: "width .3s ease, border-radius .3s ease, border-color .4s ease",
//         animation: "ft-in .3s ease",
//       }}>
//         {minimized ? (
//           /* Küçültülmüş — sadece ikon */
//           <button onClick={() => setMinimized(false)} style={{
//             width:40, height:40, borderRadius:20,
//             background:"none", border:"none", cursor:"pointer",
//             display:"flex", alignItems:"center", justifyContent:"center", fontSize:20,
//           }} title="Odak takibini aç">
//             {st.icon}
//           </button>
//         ) : (
//           <>
//             {/* Başlık */}
//             <div style={{
//               display:"flex", alignItems:"center", justifyContent:"space-between",
//               padding:"6px 9px", borderBottom:"1px solid rgba(255,255,255,0.07)",
//             }}>
//               <span style={{ color:"white", fontSize:11, fontWeight:700 }}>👁 Odak Takibi</span>
//               <div style={{ display:"flex", gap:4 }}>
//                 <button onClick={() => setEnabled(false)} style={{
//                   background:"rgba(255,255,255,0.08)", border:"none", borderRadius:5,
//                   color:"rgba(255,255,255,0.5)", fontSize:9, padding:"2px 6px",
//                   cursor:"pointer", fontWeight:600,
//                 }}>Kapat</button>
//                 <button onClick={() => setMinimized(true)} style={{
//                   background:"rgba(255,255,255,0.08)", border:"none", borderRadius:5,
//                   color:"rgba(255,255,255,0.5)", fontSize:13, width:20, height:20,
//                   cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
//                 }}>—</button>
//               </div>
//             </div>

//             {/* Uyarı bandı */}
//             {inlineAlert.show && (
//               <div style={{
//                 padding:"5px 9px", overflow:"hidden",
//                 background:`${inlineAlert.color}20`,
//                 borderBottom:`1.5px solid ${inlineAlert.color}50`,
//                 display:"flex", alignItems:"center", gap:6,
//                 animation:"ft-alert .25s ease",
//               }}>
//                 <div style={{ width:7,height:7,borderRadius:"50%",flexShrink:0, background:inlineAlert.color, animation:"ft-blink .8s infinite" }}/>
//                 <span style={{ color:"white", fontSize:10, fontWeight:600, lineHeight:1.35 }}>{inlineAlert.msg}</span>
//               </div>
//             )}

//             {/* Kamera */}
//             <div style={{ position:"relative", width:"100%", height:110, background:"#000" }}>
//               <video ref={videoRef} autoPlay playsInline muted style={{
//                 width:"100%", height:"100%", objectFit:"cover",
//                 transform:"scaleX(-1)", display:"block",
//               }}/>
//               <canvas ref={overlayRef} width={240} height={180} style={{
//                 position:"absolute", inset:0, width:"100%", height:"100%",
//                 transform:"scaleX(-1)", pointerEvents:"none",
//               }}/>
//               {!initialized && focusState!=="error" && (
//                 <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.78)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:5 }}>
//                   <div style={{ fontSize:20, animation:"ft-spin 1s linear infinite", display:"inline-block" }}>⚙️</div>
//                   <span style={{ color:"rgba(255,255,255,0.55)", fontSize:9, textAlign:"center", padding:"0 8px" }}>MediaPipe yükleniyor...</span>
//                 </div>
//               )}
//               {focusState==="error" && (
//                 <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:5,padding:8 }}>
//                   <span style={{ fontSize:20 }}>⚠️</span>
//                   <span style={{ color:"#fca5a5", fontSize:9, textAlign:"center" }}>{errorMsg}</span>
//                   <button onClick={() => { setEnabled(false); setTimeout(()=>setEnabled(true),300); }} style={{ padding:"3px 10px",borderRadius:8,background:"#ef4444",border:"none",color:"white",fontSize:10,cursor:"pointer" }}>
//                     Tekrar Dene
//                   </button>
//                 </div>
//               )}
//             </div>

//             {/* Odak barı */}
//             {initialized && (
//               <div style={{ padding:"6px 9px 5px", background:"rgba(0,0,0,0.3)" }}>
//                 <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
//                   <span style={{ color:"rgba(255,255,255,0.4)", fontSize:8, fontWeight:700, letterSpacing:".5px" }}>ODAK DURUMU</span>
//                   <span style={{ fontSize:8, fontWeight:700, color: focusBar>74?"#ef4444":focusBar>44?"#f59e0b":"#22c55e" }}>
//                     {focusBar>74 ? "⚠ Dikkat Dağınık" : focusBar>44 ? "Dikkatli Ol" : "✓ Odaklı"}
//                   </span>
//                 </div>
//                 <div style={{ width:"100%", height:6, borderRadius:4, background:"rgba(255,255,255,0.07)", overflow:"hidden", position:"relative" }}>
//                   <div style={{ position:"absolute",right:0,top:0,width:"26%",height:"100%",background:"rgba(239,68,68,0.15)",borderLeft:"1px dashed rgba(239,68,68,0.45)" }}/>
//                   <div style={{ height:"100%",borderRadius:4,width:`${focusBar}%`,background:barColor, transition:"width .3s ease, background .5s ease", boxShadow:focusBar>74?"0 0 6px rgba(239,68,68,0.5)":"none" }}/>
//                 </div>
//               </div>
//             )}

//             {/* Durum satırı */}
//             <div style={{ padding:"5px 9px", background:`${st.color}12`, borderTop:`1px solid ${st.color}25`, display:"flex", alignItems:"center", gap:6 }}>
//               <div style={{ width:8,height:8,borderRadius:"50%",background:st.color,flexShrink:0, boxShadow:`0 0 5px ${st.color}`, animation:isFocused?"none":"ft-blink 1s infinite" }}/>
//               <span style={{ color:"white", fontSize:10, fontWeight:700, flex:1 }}>{st.label}</span>
//               <span style={{ fontSize:12 }}>{st.icon}</span>
//             </div>

//             {/* Metrikler */}
//             {initialized && (
//               <div style={{ padding:"4px 7px 6px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:3 }}>
//                 {[
//                   { label:"Yatay",   value:`${metrics.yaw  >0?"→":"←"} ${Math.abs(metrics.yaw)}°`,   warn:Math.abs(metrics.yaw)  >FT_YAW },
//                   { label:"Dikey",   value:`${metrics.pitch>0?"↓":"↑"} ${Math.abs(metrics.pitch)}°`, warn:Math.abs(metrics.pitch)>FT_PITCH },
//                   { label:"Sol Göz", value:metrics.earL, warn:parseFloat(metrics.earL)<FT_EAR_THRESH },
//                   { label:"Sağ Göz", value:metrics.earR, warn:parseFloat(metrics.earR)<FT_EAR_THRESH },
//                 ].map(m => (
//                   <div key={m.label} style={{ background:"rgba(255,255,255,0.04)", borderRadius:5, padding:"3px 6px", border:m.warn?`1px solid ${st.color}44`:"1px solid transparent" }}>
//                     <div style={{ color:"rgba(255,255,255,0.3)", fontSize:8 }}>{m.label}</div>
//                     <div style={{ color:m.warn?st.color:"white", fontSize:10, fontWeight:700 }}>{m.value}</div>
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

// // ─── Ürün havuzları ───────────────────────────────────────────────────────────
// const BAKERY_POOL = [
//   { id: "simit",      name: "Simit",            emoji: "🥯" },
//   { id: "pogaca",     name: "Poğaça",           emoji: "🥐" },
//   { id: "kruvasan",   name: "Kruvasan",         emoji: "🥐" },
//   { id: "donut",      name: "Çikolatalı Donut", emoji: "🍩" },
//   { id: "baget",      name: "Baget Ekmek",      emoji: "🥖" },
//   { id: "tam_bugday", name: "Tam Buğday Ekmek", emoji: "🍞" },
//   { id: "borek",      name: "Börek",            emoji: "🥙" },
//   { id: "kurabiye",   name: "Kurabiye",         emoji: "🍪" },
// ];
// const DAIRY_POOL = [
//   { id: "sut",          name: "Süt",           emoji: "🥛" },
//   { id: "kasar",        name: "Kaşar Peyniri", emoji: "🧀" },
//   { id: "yogurt",       name: "Yoğurt",        emoji: "🫙" },
//   { id: "beyaz_peynir", name: "Beyaz Peynir",  emoji: "🧀" },
//   { id: "labne",        name: "Labne Peynir",  emoji: "🥛" },
//   { id: "tereyagi",     name: "Tereyağı",      emoji: "🧈" },
// ];
// const FRUITS_POOL = [
//   { id: "elma",     name: "Elma",     emoji: "🍎" },
//   { id: "armut",    name: "Armut",    emoji: "🍐" },
//   { id: "muz",      name: "Muz",      emoji: "🍌" },
//   { id: "domates",  name: "Domates",  emoji: "🍅" },
//   { id: "havuc",    name: "Havuç",    emoji: "🥕" },
//   { id: "biber",    name: "Biber",    emoji: "🫑" },
//   { id: "lahana",   name: "Lahana",   emoji: "🥬" },
//   { id: "portakal", name: "Portakal", emoji: "🍊" },
// ];
// const POOL_MAP = { bakery: BAKERY_POOL, dairy: DAIRY_POOL, fruits: FRUITS_POOL };

// const SECTIONS = [
//   { id: "dairy",  label: "Süt Ürünleri",  emoji: "🥛", color: "#2563eb" },
//   { id: "fruits", label: "Meyve & Sebze", emoji: "🍎", color: "#16a34a" },
//   { id: "bakery", label: "Fırın",         emoji: "🥖", color: "#d97706" },
//   { id: "kasa",   label: "Kasa",          emoji: "🧾", color: "#7c3aed" },
// ];

// function pickRandom(arr, n) { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }

// function generateShoppingList() {
//   return [
//     ...pickRandom(DAIRY_POOL,  1).map(p => ({ ...p, section: "dairy"  })),
//     ...pickRandom(FRUITS_POOL, 2).map(p => ({ ...p, section: "fruits" })),
//     ...pickRandom(BAKERY_POOL, 1).map(p => ({ ...p, section: "bakery" })),
//   ];
// }

// // Rafta listenin ürünleri + rastgele sahte ürünler karışık
// function getShelfProducts(sectionId, shoppingList) {
//   const pool     = POOL_MAP[sectionId] ?? [];
//   const needed   = shoppingList.filter(i => i.section === sectionId);
//   const neededIds = needed.map(i => i.id);
//   const extras   = pickRandom(pool.filter(p => !neededIds.includes(p.id)), 4);
//   return [...needed, ...extras].sort(() => Math.random() - 0.5);
// }

// function formatTime(s) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }

// // ════════════════════════════════════════════════════════════════════
// //  CONFIG
// // ════════════════════════════════════════════════════════════════════
// const CFG = {
//   mistral:    import.meta.env.VITE_MISTRAL_API_KEY     ?? "",
//   elevenlabs: import.meta.env.VITE_ELEVENLABS_API_KEY  ?? "",
//   voiceId:    import.meta.env.VITE_ELEVENLABS_VOICE_ID ?? "pNInz6obpgDQGcFmaJgB",
// };

// // ════════════════════════════════════════════════════════════════════
// //  API
// // ════════════════════════════════════════════════════════════════════
// async function sttElevenLabs(blob) {
//   const form = new FormData();
//   form.append("file", blob, "rec.webm");
//   form.append("model_id", "scribe_v1");
//   form.append("language_code", "tur");
//   const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
//     method: "POST", headers: { "xi-api-key": CFG.elevenlabs }, body: form,
//   });
//   if (!res.ok) throw new Error(`STT ${res.status}`);
//   return (await res.json()).text?.trim() ?? "";
// }

// async function llmMistral(systemPrompt, history) {
//   const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
//     method: "POST",
//     headers: { "Content-Type": "application/json", Authorization: `Bearer ${CFG.mistral}` },
//     body: JSON.stringify({
//       model: "mistral-small-latest",
//       messages: [{ role: "system", content: systemPrompt }, ...history],
//       temperature: 0.6,
//       max_tokens: 90,
//     }),
//   });
//   if (!res.ok) throw new Error(`LLM ${res.status}`);
//   return (await res.json()).choices?.[0]?.message?.content?.trim() ?? "";
// }

// async function ttsElevenLabs(text) {
//   const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${CFG.voiceId}/stream`, {
//     method: "POST",
//     headers: { "xi-api-key": CFG.elevenlabs, "Content-Type": "application/json" },
//     body: JSON.stringify({
//       text,
//       model_id: "eleven_multilingual_v2",
//       voice_settings: { stability: 0.55, similarity_boost: 0.80, style: 0.20 },
//     }),
//   });
//   if (!res.ok) throw new Error(`TTS ${res.status}`);
//   return URL.createObjectURL(await res.blob());
// }

// // ════════════════════════════════════════════════════════════════════
// //  SİSTEM PROMPTU — Görevli listeyi ASLA bilmez
// // ════════════════════════════════════════════════════════════════════
// function buildPrompt(screen, activeSection) {
//   const locationMap = {
//     overview: "market girişi / genel koridor",
//     dairy:    "süt ürünleri reyonu",
//     fruits:   "meyve ve sebze reyonu",
//     bakery:   "fırın reyonu",
//     kasa:     "kasa",
//   };
//   const location = screen === "shelf"
//     ? (locationMap[activeSection] ?? "reyon")
//     : (locationMap[screen] ?? "market");

//   return `Sen bir marketteki görevlisin. Müşterilerle yüz yüze konuşuyorsun.

// ÖNEMLİ KURALLAR:
// 1. Müşterinin alışveriş listesini KESİNLİKLE bilmiyorsun. Müşteri sana söylemedikçe ne aradığını bilemezsin.
// 2. Müşteri sana bir ürün veya reyon sorduğunda, o ürünün veya reyonun nerede olduğunu, nasıl bulunacağını açıkla.
// 3. Kısa ve net konuş — en fazla 2 cümle. Bu sesli bir konuşma.
// 4. Türkçe konuş, emoji veya özel karakter kullanma.
// 5. Sadece market ve alışveriş hakkında konuş.
// 6. Samimi ve yardımsever ol, gerçek bir market görevlisi gibi davran.
// 7. Eğer müşteri sana ne aradığını söylemezse, "Size nasıl yardımcı olabilirim?" diye sor.

// MEVCUT KONUM: Müşteri şu an ${location} içinde.

// Bu markette reyonlar şunlardır: Süt Ürünleri (A koridoru), Meyve ve Sebze (giriş karşısı), Fırın (B koridoru sonu), Kasa (çıkışta).`;
// }

// // ════════════════════════════════════════════════════════════════════
// //  MİKROFON HOOK
// // ════════════════════════════════════════════════════════════════════
// function useMic() {
//   const [recording,  setRecording]  = useState(false);
//   const [processing, setProcessing] = useState(false);
//   const recRef = useRef(null);
//   const chunks = useRef([]);

//   const start = useCallback(async (onResult, onErr) => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const mime   = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
//         ? "audio/webm;codecs=opus" : "audio/webm";
//       const rec = new MediaRecorder(stream, { mimeType: mime });
//       recRef.current = rec;
//       chunks.current = [];
//       rec.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data); };
//       rec.onstop = async () => {
//         stream.getTracks().forEach(t => t.stop());
//         setRecording(false);
//         setProcessing(true);
//         try {
//           const blob = new Blob(chunks.current, { type: mime });
//           onResult(await sttElevenLabs(blob));
//         } catch (e) { onErr?.(e.message); }
//         finally { setProcessing(false); }
//       };
//       rec.start();
//       setRecording(true);
//     } catch (e) { onErr?.(e.message); }
//   }, []);

//   const stop = useCallback(() => { recRef.current?.stop(); }, []);
//   return { recording, processing, start, stop };
// }

// // ════════════════════════════════════════════════════════════════════
// //  TTS HOOK
// // ════════════════════════════════════════════════════════════════════
// function useTTS() {
//   const [speaking,   setSpeaking]   = useState(false);
//   const [loadingTTS, setLoadingTTS] = useState(false);
//   const audioRef = useRef(null);

//   const speak = useCallback(async (text) => {
//     if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
//     setLoadingTTS(true);
//     try {
//       const url   = await ttsElevenLabs(text);
//       const audio = new Audio(url);
//       audioRef.current = audio;
//       audio.onplay  = () => { setSpeaking(true);  setLoadingTTS(false); };
//       audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
//       audio.onerror = () => { setSpeaking(false); setLoadingTTS(false); };
//       await audio.play();
//     } catch (e) { console.error("TTS:", e); setLoadingTTS(false); }
//   }, []);

//   const stop = useCallback(() => {
//     audioRef.current?.pause();
//     audioRef.current = null;
//     setSpeaking(false);
//     setLoadingTTS(false);
//   }, []);

//   return { speaking, loadingTTS, speak, stop };
// }

// // ════════════════════════════════════════════════════════════════════
// //  ALIŞVERİŞ LİSTESİ — kullanıcının cebindeki not (köşede küçük)
// // ════════════════════════════════════════════════════════════════════
// function MyList({ shoppingList, collected, visible, onToggle }) {
//   return (
//     <div style={{ position: "absolute", left: 12, bottom: 12, zIndex: 20 }}>
//       <button
//         onClick={onToggle}
//         style={{
//           padding: "8px 14px",
//           borderRadius: 20,
//           background: "rgba(0,0,0,0.75)",
//           border: "1.5px solid rgba(255,255,255,0.25)",
//           color: "white",
//           fontSize: 12,
//           fontWeight: 700,
//           cursor: "pointer",
//           backdropFilter: "blur(8px)",
//           display: "flex",
//           alignItems: "center",
//           gap: 6,
//         }}
//       >
//         📋 Listem {visible ? "▾" : "▸"}
//       </button>

//       {visible && (
//         <div style={{
//           position: "absolute",
//           bottom: 44,
//           left: 0,
//           background: "rgba(15,23,42,0.95)",
//           border: "1px solid rgba(255,255,255,0.12)",
//           borderRadius: 16,
//           padding: "14px 16px",
//           minWidth: 200,
//           boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
//           backdropFilter: "blur(12px)",
//           animation: "fadeUp .2s ease",
//         }}>
//           <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, marginBottom: 10, letterSpacing: ".5px" }}>
//             ALIŞVERİŞ LİSTEM
//           </div>
//           {shoppingList.map(item => {
//             const done = collected.includes(item.id);
//             return (
//               <div key={item.id} style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 8,
//                 padding: "6px 0",
//                 borderBottom: "1px solid rgba(255,255,255,0.06)",
//               }}>
//                 <span style={{ fontSize: 18 }}>{item.emoji}</span>
//                 <span style={{
//                   fontSize: 13,
//                   fontWeight: 600,
//                   color: done ? "#4ade80" : "rgba(255,255,255,0.85)",
//                   textDecoration: done ? "line-through" : "none",
//                   flex: 1,
//                 }}>
//                   {item.name}
//                 </span>
//                 {done && <span style={{ fontSize: 14 }}>✅</span>}
//               </div>
//             );
//           })}
//           <div style={{
//             marginTop: 10,
//             fontSize: 11,
//             color: "rgba(255,255,255,0.3)",
//             textAlign: "center",
//           }}>
//             {collected.length}/{shoppingList.length} ürün alındı
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // ════════════════════════════════════════════════════════════════════
// //  GÖREVLÎ PANELİ — sağda sabit, konuşmak için bas-bırak
// //  Görevli konuşurken/dinlerken ekranın geri kalanı KİLİTLİ
// // ════════════════════════════════════════════════════════════════════
// function StaffPanel({
//   speaking, loadingTTS, recording, processing, thinking,
//   lastMessage, userTranscript,
//   onMicDown, onMicUp,
// }) {
//   const busy = speaking || loadingTTS || recording || processing || thinking;

//   const statusText =
//     recording   ? "Sizi dinliyorum..." :
//     processing  ? "Anlıyorum..."       :
//     thinking    ? "Düşünüyorum..."     :
//     loadingTTS  ? "Cevap hazırlanıyor..." :
//     speaking    ? "Konuşuyorum..."     :
//     "Sormak için basılı tut";

//   const faceEmoji =
//     recording ? "🎙️" :
//     speaking  ? "🗣️" :
//     (thinking || processing || loadingTTS) ? "💭" : "🧑‍💼";

//   const ringColor = recording ? "#ef4444" : speaking ? "#f59e0b" : "transparent";

//   return (
//     <div style={{
//       position: "absolute",
//       right: 0, top: 0, bottom: 0,
//       width: "clamp(165px, 21vw, 230px)",
//       display: "flex",
//       flexDirection: "column",
//       alignItems: "center",
//       justifyContent: "flex-start",
//       paddingTop: 20,
//       gap: 12,
//       background: "linear-gradient(180deg, rgba(6,10,24,0.97) 0%, rgba(6,10,24,0.93) 100%)",
//       borderLeft: "1px solid rgba(255,255,255,0.07)",
//       zIndex: 30,
//     }}>
//       {/* Rozet */}
//       <div style={{
//         background: "rgba(255,255,255,0.06)",
//         border: "1px solid rgba(255,255,255,0.1)",
//         borderRadius: 10,
//         padding: "4px 12px",
//         display: "flex",
//         alignItems: "center",
//         gap: 5,
//       }}>
//         <span style={{ fontSize: 10 }}>🏷️</span>
//         <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 700 }}>Market Görevlisi</span>
//       </div>

//       {/* Avatar + halkalar */}
//       <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
//         {(speaking || recording) && (
//           <>
//             <div style={{ position: "absolute", width: 112, height: 112, borderRadius: "50%", border: `2px solid ${ringColor}`, opacity: 0.3, animation: "avRing 1.6s ease-out infinite" }} />
//             <div style={{ position: "absolute", width: 90,  height: 90,  borderRadius: "50%", border: `2px solid ${ringColor}`, opacity: 0.5, animation: "avRing 1.6s ease-out infinite .4s" }} />
//           </>
//         )}
//         {(loadingTTS || processing || thinking) && !speaking && !recording && (
//           <div style={{ position: "absolute", width: 84, height: 84, borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#f59e0b", animation: "avSpin 0.9s linear infinite" }} />
//         )}
//         <div style={{
//           width: 70, height: 70, borderRadius: "50%",
//           background: recording
//             ? "linear-gradient(135deg,#ef4444,#b91c1c)"
//             : speaking
//             ? "linear-gradient(135deg,#f59e0b,#ea580c)"
//             : "linear-gradient(135deg,#1e3a8a,#3b82f6)",
//           border: "3px solid rgba(255,255,255,0.88)",
//           boxShadow: speaking ? "0 0 28px rgba(245,158,11,.65)" : recording ? "0 0 28px rgba(239,68,68,.65)" : "0 4px 20px rgba(0,0,0,.5)",
//           display: "flex", alignItems: "center", justifyContent: "center",
//           fontSize: 30, transition: "all .3s",
//         }}>
//           {faceEmoji}
//         </div>
//       </div>

//       {/* Ses dalgası */}
//       <div style={{ display: "flex", alignItems: "center", gap: 2, height: 18 }}>
//         {[3, 5, 8, 5, 10, 5, 8, 5, 3].map((h, i) => (
//           <div key={i} style={{
//             width: 3, borderRadius: 2,
//             background: speaking ? "#f59e0b" : recording ? "#ef4444" : "rgba(255,255,255,0.12)",
//             height: (speaking || recording) ? `${h * 2}px` : "3px",
//             animation: (speaking || recording) ? `avWave 0.9s ease-in-out infinite ${i * 0.08}s` : "none",
//             transition: "height .3s ease, background .3s",
//           }} />
//         ))}
//       </div>

//       {/* Durum yazısı */}
//       <div style={{
//         color: recording ? "#fca5a5" : speaking ? "#fde68a" : "rgba(255,255,255,0.45)",
//         fontSize: 10, fontWeight: 600, textAlign: "center",
//         lineHeight: 1.4, minHeight: 24, padding: "0 10px",
//         animation: busy ? "avPulse 1.5s infinite" : "none",
//       }}>
//         {statusText}
//       </div>

//       {/* Son söylenen mesaj */}
//       {lastMessage && (
//         <div style={{
//           margin: "0 10px",
//           padding: "10px 12px",
//           background: "rgba(255,255,255,0.05)",
//           border: "1px solid rgba(255,255,255,0.09)",
//           borderRadius: 12,
//           color: "rgba(255,255,255,0.8)",
//           fontSize: 11, lineHeight: 1.55,
//           maxHeight: 110, overflowY: "auto",
//           animation: "fadeUp .25s ease",
//         }}>
//           {lastMessage}
//         </div>
//       )}

//       {/* Kullanıcının söylediği */}
//       {userTranscript && (
//         <div style={{
//           margin: "0 10px",
//           padding: "8px 12px",
//           background: "rgba(245,158,11,0.1)",
//           border: "1px solid rgba(245,158,11,0.25)",
//           borderRadius: 12,
//           color: "#fde68a",
//           fontSize: 10, lineHeight: 1.4,
//           animation: "fadeUp .2s ease",
//         }}>
//           🗣️ {userTranscript}
//         </div>
//       )}

//       {/* Kilit uyarısı — görevli konuşurken */}
//       {busy && !recording && (
//         <div style={{
//           margin: "0 10px",
//           padding: "6px 10px",
//           background: "rgba(239,68,68,0.1)",
//           border: "1px solid rgba(239,68,68,0.2)",
//           borderRadius: 10,
//           color: "#fca5a5",
//           fontSize: 9, fontWeight: 700,
//           textAlign: "center",
//         }}>
//           🔒 Görevli konuşurken bekleyin
//         </div>
//       )}

//       {/* Mikrofon */}
//       <button
//         onMouseDown={onMicDown}
//         onMouseUp={onMicUp}
//         onTouchStart={onMicDown}
//         onTouchEnd={onMicUp}
//         disabled={speaking || loadingTTS || processing || thinking}
//         style={{
//           marginTop: "auto",
//           marginBottom: 18,
//           width: 54, height: 54,
//           borderRadius: "50%",
//           border: "none",
//           background: recording
//             ? "#ef4444"
//             : (speaking || loadingTTS || processing || thinking)
//             ? "rgba(255,255,255,0.06)"
//             : "rgba(245,158,11,0.85)",
//           color: "white", fontSize: 22,
//           cursor: (speaking || loadingTTS || processing || thinking) ? "not-allowed" : "pointer",
//           display: "flex", alignItems: "center", justifyContent: "center",
//           boxShadow: recording ? "0 0 0 0 rgba(239,68,68,.5)" : "0 4px 16px rgba(0,0,0,.35)",
//           animation: recording ? "avMicRipple 1s infinite" : "none",
//           transition: "background .2s, opacity .2s",
//           opacity: (speaking || loadingTTS || processing || thinking) ? 0.35 : 1,
//           flexShrink: 0,
//         }}
//       >
//         {recording ? "⏹" : (processing || thinking || loadingTTS) ? "⏳" : "🎙️"}
//       </button>

//       <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, textAlign: "center", margin: "0 0 8px", padding: "0 8px" }}>
//         Basılı tut → konuş → bırak
//       </p>
//     </div>
//   );
// }

// // ════════════════════════════════════════════════════════════════════
// //  OVERLAY KİLİDİ — görevli konuşurken tüm ekranda şeffaf bariyer
// // ════════════════════════════════════════════════════════════════════
// function InteractionLock({ active }) {
//   if (!active) return null;
//   return (
//     <div style={{
//       position: "absolute",
//       inset: 0,
//       right: "clamp(165px, 21vw, 230px)", // görevli paneli hariç
//       zIndex: 25,
//       cursor: "not-allowed",
//       background: "rgba(0,0,0,0.01)", // görünmez ama tıklamaları yutar
//     }} />
//   );
// }

// // ════════════════════════════════════════════════════════════════════
// //  OVERVIEW EKRANI
// // ════════════════════════════════════════════════════════════════════
// function OverviewScreen({ shoppingList, collected, onSelectSection, locked }) {
//   return (
//     <div style={{
//       position: "absolute", inset: 0,
//       backgroundImage: `url('${IMG.overview}')`,
//       backgroundSize: "cover", backgroundPosition: "center",
//     }}>
//       <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.42)" }} />
//       <div style={{
//         position: "absolute", inset: 0, zIndex: 2,
//         display: "flex", flexDirection: "column",
//         alignItems: "center", justifyContent: "center",
//         gap: 18, padding: "20px",
//       }}>
//         <div style={{
//           background: "rgba(0,0,0,0.65)",
//           borderRadius: 18, padding: "12px 22px",
//           textAlign: "center",
//           border: "1px solid rgba(255,255,255,0.1)",
//           backdropFilter: "blur(8px)",
//         }}>
//           <div style={{ color: "white", fontSize: 16, fontWeight: 800 }}>
//             Hangi reyona gidiyorsun?
//           </div>
//           <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 3 }}>
//             Bir reyona dokunarak git • Bilmiyorsan görevliye sor →
//           </div>
//         </div>

//         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, width: "100%", maxWidth: 400 }}>
//           {SECTIONS.map(sec => {
//             const needed   = shoppingList.filter(i => i.section === sec.id);
//             const doneArr  = needed.filter(i => collected.includes(i.id));
//             const allDone  = needed.length > 0 && doneArr.length === needed.length;

//             return (
//               <button
//                 key={sec.id}
//                 onClick={() => !locked && onSelectSection(sec.id)}
//                 style={{
//                   padding: "18px 14px",
//                   borderRadius: 18,
//                   background: allDone ? "rgba(34,197,94,0.9)" : "rgba(255,255,255,0.92)",
//                   border: `3px solid ${allDone ? "#22c55e" : sec.color}`,
//                   boxShadow: allDone ? "0 4px 20px rgba(34,197,94,.4)" : `0 4px 20px ${sec.color}33`,
//                   display: "flex", flexDirection: "column",
//                   alignItems: "center", gap: 5,
//                   cursor: locked ? "not-allowed" : "pointer",
//                   opacity: locked ? 0.55 : 1,
//                   transition: "transform .15s, opacity .2s",
//                   transform: "scale(1)",
//                 }}
//                 onMouseDown={e => { if (!locked) e.currentTarget.style.transform = "scale(0.95)"; }}
//                 onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
//               >
//                 <span style={{ fontSize: 34 }}>{sec.emoji}</span>
//                 <span style={{ fontSize: 14, fontWeight: 800, color: allDone ? "white" : sec.color }}>
//                   {sec.label}
//                 </span>
//                 {allDone && (
//                   <span style={{ fontSize: 10, color: "white", fontWeight: 700, background: "rgba(255,255,255,0.25)", padding: "1px 8px", borderRadius: 10 }}>
//                     ✅ Tamamlandı
//                   </span>
//                 )}
//               </button>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ════════════════════════════════════════════════════════════════════
// //  SHELF EKRANI
// // ════════════════════════════════════════════════════════════════════
// function ShelfScreen({ sectionId, shoppingList, collected, onCollect, onBack, locked }) {
//   const [shelfProducts] = useState(() => getShelfProducts(sectionId, shoppingList));
//   const [justPicked, setJustPicked] = useState(null);
//   const sec = SECTIONS.find(s => s.id === sectionId);

//   function handlePick(product) {
//     if (locked || collected.includes(product.id)) return;
//     setJustPicked(product.id);
//     onCollect(product);
//     setTimeout(() => setJustPicked(null), 1000);
//   }

//   return (
//     <div style={{
//       position: "absolute", inset: 0,
//       backgroundImage: `url('${IMG[sectionId]}')`,
//       backgroundSize: "cover", backgroundPosition: "center",
//     }}>
//       <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
//       <div style={{
//         position: "absolute", inset: 0, zIndex: 2,
//         display: "flex", flexDirection: "column",
//         padding: "14px 14px 14px 14px",
//       }}>
//         {/* Başlık */}
//         <div style={{
//           background: "rgba(0,0,0,0.7)", borderRadius: 14,
//           padding: "9px 16px", marginBottom: 12,
//           display: "flex", alignItems: "center", justifyContent: "space-between",
//           flexShrink: 0, backdropFilter: "blur(8px)",
//           border: "1px solid rgba(255,255,255,0.08)",
//         }}>
//           <div>
//             <span style={{ fontSize: 16 }}>{sec?.emoji}</span>
//             <span style={{ color: "white", fontWeight: 800, fontSize: 14, marginLeft: 6 }}>{sec?.label}</span>
//           </div>
//           <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 10 }}>
//             Almak istediğin ürüne dokun
//           </span>
//         </div>

//         {/* Ürün ızgarası */}
//         <div style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(4, 1fr)",
//           gap: 10, flex: 1,
//           alignContent: "start",
//           overflowY: "auto", paddingBottom: 8,
//         }}>
//           {shelfProducts.map(p => {
//             const isDone     = collected.includes(p.id);
//             const isJust     = justPicked === p.id;
//             return (
//               <button
//                 key={p.id}
//                 onClick={() => handlePick(p)}
//                 disabled={isDone || locked}
//                 style={{
//                   padding: "12px 6px",
//                   borderRadius: 16,
//                   background: isDone ? "rgba(34,197,94,0.85)" : "rgba(255,255,255,0.93)",
//                   border: isDone
//                     ? "3px solid #22c55e"
//                     : isJust
//                     ? "3px solid #22c55e"
//                     : "2px solid rgba(200,200,200,0.5)",
//                   boxShadow: isJust
//                     ? "0 0 20px rgba(34,197,94,.8)"
//                     : isDone
//                     ? "none"
//                     : "0 2px 8px rgba(0,0,0,.3)",
//                   display: "flex", flexDirection: "column",
//                   alignItems: "center", gap: 5,
//                   cursor: isDone || locked ? "default" : "pointer",
//                   opacity: locked && !isDone ? 0.5 : 1,
//                   transform: isJust ? "scale(1.06)" : "scale(1)",
//                   transition: "transform .2s, box-shadow .2s, opacity .2s",
//                 }}
//               >
//                 <span style={{ fontSize: 28 }}>{isDone ? "✅" : p.emoji}</span>
//                 <span style={{
//                   fontSize: 10, fontWeight: 700,
//                   color: isDone ? "white" : "#1e293b",
//                   textAlign: "center", lineHeight: 1.2,
//                 }}>
//                   {p.name}
//                 </span>
//               </button>
//             );
//           })}
//         </div>

//         {/* Geri */}
//         <button
//           onClick={() => !locked && onBack()}
//           style={{
//             marginTop: 10, padding: "10px 0",
//             borderRadius: 14,
//             background: locked ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.92)",
//             border: "none",
//             color: "#1e293b", fontWeight: 800, fontSize: 13,
//             cursor: locked ? "not-allowed" : "pointer",
//             flexShrink: 0,
//             boxShadow: "0 4px 14px rgba(0,0,0,.3)",
//             opacity: locked ? 0.5 : 1,
//             transition: "opacity .2s",
//           }}
//         >
//           ← Reyonlara Geri Dön
//         </button>
//       </div>
//     </div>
//   );
// }

// // ════════════════════════════════════════════════════════════════════
// //  KASA EKRANI
// // ════════════════════════════════════════════════════════════════════
// function KasaScreen({ shoppingList, collected, onPay, onBack, locked }) {
//   const [chosen, setChosen]       = useState(null);
//   const [confirmed, setConfirmed] = useState(false);

//   function handleConfirm() {
//     if (!chosen || locked) return;
//     setConfirmed(true);
//     setTimeout(() => onPay(chosen), 1800);
//   }

//   return (
//     <div style={{
//       position: "absolute", inset: 0,
//       backgroundImage: `url('${IMG.kasa}')`,
//       backgroundSize: "cover", backgroundPosition: "center",
//     }}>
//       <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.52)" }} />
//       <div style={{
//         position: "absolute", inset: 0, zIndex: 5,
//         display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
//       }}>
//         <div style={{
//           background: "rgba(255,255,255,0.97)", borderRadius: 24,
//           padding: "26px 26px", width: "min(370px,80vw)",
//           boxShadow: "0 16px 50px rgba(0,0,0,.45)",
//           display: "flex", flexDirection: "column", gap: 14,
//           opacity: locked ? 0.6 : 1, transition: "opacity .2s",
//         }}>
//           <div style={{ textAlign: "center" }}>
//             <div style={{ fontSize: 38 }}>🧾</div>
//             <h3 style={{ fontWeight: 800, color: "#1e293b", fontSize: 17, margin: "6px 0 2px" }}>
//               Ödeme Yöntemi
//             </h3>
//             <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>
//               Nasıl ödemek istiyorsun?
//             </p>
//           </div>

//           {/* Sepet */}
//           <div style={{ borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
//             {shoppingList.map(item => {
//               const done = collected.includes(item.id);
//               return (
//                 <div key={item.id} style={{
//                   display: "flex", justifyContent: "space-between",
//                   padding: "7px 12px", borderBottom: "1px solid #f1f5f9",
//                   background: done ? "#f0fdf4" : "white",
//                 }}>
//                   <span style={{ fontSize: 12, fontWeight: 600, color: done ? "#15803d" : "#64748b" }}>
//                     {item.emoji} {item.name}
//                   </span>
//                   <span style={{ fontSize: 11, color: done ? "#16a34a" : "#94a3b8", fontWeight: 700 }}>
//                     {done ? "✅ Alındı" : "Alınmadı"}
//                   </span>
//                 </div>
//               );
//             })}
//           </div>

//           {!confirmed ? (
//             <>
//               <div style={{ display: "flex", gap: 10 }}>
//                 {[
//                   { id: "card", label: "Kartla Öde",  emoji: "💳", color: "#2563eb" },
//                   { id: "cash", label: "Nakitle Öde", emoji: "💵", color: "#16a34a" },
//                 ].map(opt => (
//                   <button
//                     key={opt.id}
//                     onClick={() => !locked && setChosen(opt.id)}
//                     style={{
//                       flex: 1, padding: "13px 8px", borderRadius: 14,
//                       background: chosen === opt.id ? opt.color : "white",
//                       border: `3px solid ${opt.color}`,
//                       color: chosen === opt.id ? "white" : opt.color,
//                       fontWeight: 800, fontSize: 13,
//                       cursor: locked ? "not-allowed" : "pointer",
//                       display: "flex", flexDirection: "column",
//                       alignItems: "center", gap: 3,
//                       boxShadow: chosen === opt.id ? `0 4px 14px ${opt.color}44` : "none",
//                       transition: "all .2s",
//                     }}
//                   >
//                     <span style={{ fontSize: 26 }}>{opt.emoji}</span>
//                     <span>{opt.label}</span>
//                   </button>
//                 ))}
//               </div>

//               {chosen && (
//                 <button
//                   onClick={handleConfirm}
//                   style={{
//                     padding: "12px", borderRadius: 13,
//                     background: locked ? "#94a3b8" : "#1e293b",
//                     color: "white", fontWeight: 800, fontSize: 14,
//                     border: "none", cursor: locked ? "not-allowed" : "pointer",
//                     boxShadow: "0 4px 14px rgba(0,0,0,.25)",
//                     animation: "fadeUp .2s ease",
//                   }}
//                 >
//                   ✓ Ödemeyi Onayla
//                 </button>
//               )}

//               <button
//                 onClick={() => !locked && onBack()}
//                 style={{
//                   padding: "8px", borderRadius: 11,
//                   background: "#f1f5f9", color: "#475569",
//                   fontWeight: 700, fontSize: 12,
//                   border: "none", cursor: locked ? "not-allowed" : "pointer",
//                 }}
//               >
//                 ← Geri Dön
//               </button>
//             </>
//           ) : (
//             <div style={{
//               textAlign: "center", padding: "18px",
//               background: "#f0fdf4", borderRadius: 14,
//               border: "2px solid #86efac",
//               color: "#16a34a", fontWeight: 800, fontSize: 15,
//               animation: "fadeUp .3s ease",
//             }}>
//               {chosen === "card" ? "💳 Kart okutuldu!" : "💵 Nakit ödendi!"}
//               <div style={{ fontSize: 12, marginTop: 5, color: "#15803d" }}>
//                 Alışveriş tamamlanıyor...
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ════════════════════════════════════════════════════════════════════
// //  RAPOR
// // ════════════════════════════════════════════════════════════════════
// function ReportModal({ shoppingList, collected, elapsed, payMethod, onRestart, onHome }) {
//   const correct = shoppingList.filter(i => collected.includes(i.id)).length;
//   const stars   = correct === 4 ? 3 : correct >= 2 ? 2 : 1;
//   return (
//     <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
//       <div style={{
//         background: "white", borderRadius: 28, padding: "34px 30px",
//         width: "min(480px,94vw)",
//         boxShadow: "0 20px 60px rgba(0,0,0,.5)",
//         display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
//         animation: "fadeUp .35s ease",
//       }}>
//         <div style={{ display: "flex", gap: 4 }}>
//           {[1, 2, 3].map(n => <span key={n} style={{ fontSize: 34, opacity: n <= stars ? 1 : 0.2 }}>⭐</span>)}
//         </div>
//         <h2 style={{ fontSize: 21, fontWeight: 800, color: "#1e293b", margin: 0 }}>Alışveriş Raporu</h2>
//         <div style={{ display: "flex", gap: 20, width: "100%", background: "#f8fafc", borderRadius: 16, padding: 16 }}>
//           {[
//             { label: "Doğru Ürün", value: `${correct}/${shoppingList.length}`, color: correct === shoppingList.length ? "#16a34a" : "#f59e0b" },
//             { label: "Süre",       value: formatTime(elapsed), color: "#2563eb" },
//             { label: "Ödeme",      value: payMethod === "card" ? "💳 Kart" : "💵 Nakit", color: "#7c3aed" },
//           ].map(s => (
//             <div key={s.label} style={{ flex: 1, textAlign: "center" }}>
//               <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
//               <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
//             </div>
//           ))}
//         </div>
//         <div style={{ width: "100%", borderRadius: 13, border: "1px solid #e2e8f0", overflow: "hidden" }}>
//           {shoppingList.map(item => {
//             const done = collected.includes(item.id);
//             return (
//               <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", borderBottom: "1px solid #f8fafc" }}>
//                 <span style={{ fontSize: 13, color: done ? "#16a34a" : "#ef4444", fontWeight: 600 }}>
//                   {item.emoji} {item.name}
//                 </span>
//                 <span style={{ fontSize: 11, background: done ? "#dcfce7" : "#fee2e2", color: done ? "#16a34a" : "#ef4444", borderRadius: 20, padding: "2px 10px", fontWeight: 700 }}>
//                   {done ? "✅ Alındı" : "❌ Alınmadı"}
//                 </span>
//               </div>
//             );
//           })}
//         </div>
//         <p style={{ color: "#475569", fontSize: 14, fontWeight: 600, textAlign: "center", margin: 0 }}>
//           {correct === 4 ? "🎉 Mükemmel! Tüm ürünleri başarıyla aldın!"
//             : correct >= 2 ? "👍 Çok iyi! Biraz daha pratikle mükemmel olacaksın."
//             : "💪 Devam et! Her seferinde daha iyi olacaksın."}
//         </p>
//         <div style={{ display: "flex", gap: 12, width: "100%" }}>
//           <button onClick={onRestart} style={{ flex: 1, padding: "12px 0", borderRadius: 13, background: "#2563eb", color: "white", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer" }}>
//             🔄 Tekrar Dene
//           </button>
//           <button onClick={onHome} style={{ flex: 1, padding: "12px 0", borderRadius: 13, background: "#475569", color: "white", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer" }}>
//             🏠 Ana Sayfa
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ════════════════════════════════════════════════════════════════════
// //  ANA BİLEŞEN
// // ════════════════════════════════════════════════════════════════════
// export default function MarketScenario({ onExit }) {
//   const [shoppingList,   setShoppingList]   = useState(() => generateShoppingList());
//   const [screen,         setScreen]         = useState("overview");
//   const [activeSection,  setActiveSection]  = useState(null);
//   const [collected,      setCollected]      = useState([]);
//   const [elapsed,        setElapsed]        = useState(0);
//   const [payMethod,      setPayMethod]      = useState(null);
//   const [listVisible,    setListVisible]    = useState(false);

//   // Diyalog
//   const [messages,       setMessages]       = useState([]);
//   const [userTranscript, setUserTranscript] = useState("");
//   const [thinking,       setThinking]       = useState(false);
//   const [lastStaffMsg,   setLastStaffMsg]   = useState("");

//   const timerRef = useRef(null);
//   const { recording, processing, start: startMic, stop: stopMic } = useMic();
//   const { speaking, loadingTTS, speak, stop: stopTTS } = useTTS();

//   // Görevli konuşurken ya da işlem yaparken UI kilidi
//   const uiLocked = speaking || loadingTTS || recording || processing || thinking;

//   useEffect(() => {
//     timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
//     return () => clearInterval(timerRef.current);
//   }, []);

//   // Ekran değişince görevli SADECE genel karşılama yapar — listeyi bilmez
//   const greetedScreens = useRef(new Set());
//   useEffect(() => {
//     const key = screen === "shelf" ? `shelf-${activeSection}` : screen;
//     if (greetedScreens.current.has(key)) return;
//     greetedScreens.current.add(key);

//     const greetMap = {
//       overview: "Merhaba, hoş geldiniz! Size nasıl yardımcı olabilirim?",
//       "shelf-dairy":  "Süt ürünleri reyonundasınız. Yardımcı olmamı ister misiniz?",
//       "shelf-fruits": "Meyve ve sebze reyonundasınız. Bir şey sormak ister misiniz?",
//       "shelf-bakery": "Fırın reyonundasınız. Yardımcı olmamı ister misiniz?",
//       kasa: "Kasaya hoş geldiniz. Ödeme konusunda sorunuz varsa yardımcı olabilirim.",
//     };
//     const msg = greetMap[key];
//     if (msg) setTimeout(() => staffSay(msg), 600);
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [screen, activeSection]);

//   async function staffSay(text) {
//     if (!text) return;
//     stopTTS();
//     setLastStaffMsg(text);
//     setMessages(prev => [...prev, { role: "assistant", content: text }]);
//     await speak(text);
//   }

//   async function handleUserInput(transcript) {
//     if (!transcript?.trim()) return;
//     setUserTranscript(transcript);
//     const newHistory = [...messages, { role: "user", content: transcript }];
//     setMessages(newHistory);
//     setThinking(true);
//     stopTTS();

//     try {
//       const prompt = buildPrompt(screen, activeSection);
//       const reply  = await llmMistral(prompt, newHistory.map(m => ({ role: m.role, content: m.content })));
//       setLastStaffMsg(reply);
//       setMessages(prev => [...prev, { role: "assistant", content: reply }]);
//       setThinking(false);
//       await speak(reply);
//     } catch (e) {
//       console.error("LLM:", e);
//       setThinking(false);
//       const err = "Özür dilerim, şu an anlayamadım. Tekrar söyler misiniz?";
//       setLastStaffMsg(err);
//       setMessages(prev => [...prev, { role: "assistant", content: err }]);
//     } finally {
//       setUserTranscript("");
//     }
//   }

//   function handleSelectSection(sectionId) {
//     if (uiLocked) return;
//     if (sectionId === "kasa") {
//       setScreen("kasa");
//     } else {
//       setActiveSection(sectionId);
//       setScreen("shelf");
//     }
//   }

//   function handleCollect(product) {
//     if (uiLocked) return;
//     setCollected(prev => prev.includes(product.id) ? prev : [...prev, product.id]);
//   }

//   function handlePay(method) {
//     setPayMethod(method);
//     clearInterval(timerRef.current);
//     const msg = method === "card"
//       ? "Kartınızla ödeme alındı, teşekkürler. İyi günler!"
//       : "Nakit ödemeniz alındı, teşekkürler. İyi günler!";
//     staffSay(msg);
//     setTimeout(() => setScreen("done"), 2800);
//   }

//   function handleRestart() {
//     greetedScreens.current = new Set();
//     setShoppingList(generateShoppingList());
//     setCollected([]); setScreen("overview"); setActiveSection(null);
//     setElapsed(0); setPayMethod(null); setMessages([]);
//     setUserTranscript(""); setLastStaffMsg(""); setListVisible(false);
//     timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
//   }

//   const handleMicDown = useCallback(() => {
//     if (speaking || loadingTTS || processing || thinking) return;
//     stopTTS();
//     startMic(
//       async (transcript) => { if (transcript?.trim()) await handleUserInput(transcript); },
//       (err) => console.warn("MIC:", err)
//     );
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [screen, activeSection, messages, speaking, loadingTTS, processing, thinking]);

//   const handleMicUp = useCallback(() => stopMic(), [stopMic]);

//   return (
//     <div style={{
//       position: "fixed", inset: 0, zIndex: 100,
//       display: "flex", flexDirection: "column",
//       background: "#000", fontFamily: "system-ui, sans-serif",
//     }}>
//       <style>{`
//         @keyframes avRing      { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.55);opacity:0} }
//         @keyframes avSpin      { to{transform:rotate(360deg)} }
//         @keyframes avWave      { 0%,100%{transform:scaleY(.35)} 50%{transform:scaleY(1)} }
//         @keyframes avPulse     { 0%,100%{opacity:1} 50%{opacity:.4} }
//         @keyframes avMicRipple { 0%{box-shadow:0 0 0 0 rgba(239,68,68,.5)} 100%{box-shadow:0 0 0 20px rgba(239,68,68,0)} }
//         @keyframes fadeUp      { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
//       `}</style>

//       {/* HUD */}
//       <div style={{
//         display: "flex", alignItems: "center", justifyContent: "space-between",
//         padding: "8px 14px", flexShrink: 0,
//         background: "rgba(0,0,0,0.92)", borderBottom: "1px solid rgba(255,255,255,0.06)",
//       }}>
//         <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//           <span style={{ color: "white", fontSize: 16 }}>🛒</span>
//           <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600 }}>
//             Market Alışverişi
//           </span>
//         </div>
//         <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//           <div style={{ borderRadius: 20, padding: "3px 10px", fontWeight: 700, fontSize: 11, background: "rgba(255,255,255,0.08)", color: "white" }}>
//             ⏱ {formatTime(elapsed)}
//           </div>
//           {onExit && (
//             <button onClick={onExit} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", color: "white", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
//           )}
//         </div>
//       </div>

//       {/* Ana alan */}
//       <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

//         {screen === "overview" && (
//           <OverviewScreen
//             shoppingList={shoppingList}
//             collected={collected}
//             onSelectSection={handleSelectSection}
//             locked={uiLocked}
//           />
//         )}
//         {screen === "shelf" && activeSection && (
//           <ShelfScreen
//             sectionId={activeSection}
//             shoppingList={shoppingList}
//             collected={collected}
//             onCollect={handleCollect}
//             onBack={() => { if (!uiLocked) { setScreen("overview"); setActiveSection(null); } }}
//             locked={uiLocked}
//           />
//         )}
//         {screen === "kasa" && (
//           <KasaScreen
//             shoppingList={shoppingList}
//             collected={collected}
//             onPay={handlePay}
//             onBack={() => { if (!uiLocked) setScreen("overview"); }}
//             locked={uiLocked}
//           />
//         )}

//         {/* Ekran kilidi overlay (görevli konuşurken) */}
//         <InteractionLock active={uiLocked} />

//         {/* Listem butonu + popup */}
//         {screen !== "done" && (
//           <MyList
//             shoppingList={shoppingList}
//             collected={collected}
//             visible={listVisible && !uiLocked}
//             onToggle={() => { if (!uiLocked) setListVisible(v => !v); }}
//           />
//         )}

//         {/* Görevli paneli */}
//         {screen !== "done" && (
//           <StaffPanel
//             speaking={speaking}
//             loadingTTS={loadingTTS}
//             recording={recording}
//             processing={processing}
//             thinking={thinking}
//             lastMessage={lastStaffMsg}
//             userTranscript={userTranscript}
//             onMicDown={handleMicDown}
//             onMicUp={handleMicUp}
//           />
//         )}
//       </div>

//       {screen === "done" && (
//         <ReportModal
//           shoppingList={shoppingList}
//           collected={collected}
//           elapsed={elapsed}
//           payMethod={payMethod}
//           onRestart={handleRestart}
//           onHome={onExit}
//         />
//       )}
//     </div>
//   );
// }