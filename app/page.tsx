"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 20;
const MAXLEN = 300;
const EMAIL = "contact@plasticfisherman.com";

type Lang = "es" | "en";
type Role = "resident" | "manager" | "company" | "student" | "curious";
type Item = { id: number; from: "user" | "bot"; text: string; lang: Lang; pending?: boolean };
type ApiMessage = { role: "user" | "assistant"; content: string };

const TEXT = {
  limit: {
    es: `Para seguir, escríbenos a ${EMAIL}.`,
    en: `To keep going, write to us at ${EMAIL}.`,
  },
  error: {
    es: `Ups, no pude responder. Escríbenos a ${EMAIL}.`,
    en: `Oops, I couldn't answer. Write to us at ${EMAIL}.`,
  },
  welcome:
    "¡Hola! Soy Cap Coach. Te cuento cómo 19,000 tapas se convierten en una banca. ¿Quién me escribe: residente de un edificio, administrador o desarrollador, empresa, estudiante o persona curiosa?\n\nHi! I'm Cap Coach. Who's visiting today: resident, building manager or developer, company, student or just curious?",
};

const ROLE_CHIPS: Record<Lang, string[]> = {
  es: ["Soy residente", "Administro un edificio", "Empresa", "Estudiante", "Solo curiosidad"],
  en: ["Resident", "Building manager", "Company", "Student", "Just curious"],
};

const NEXT_CHIPS: Record<Lang, Record<Role, string[]>> = {
  es: {
    resident: ["¿Qué tapas sirven?", "¿Qué pasa con las tapas?", "¿Cómo participo?"],
    manager: ["Ver precios", "¿Cuánto tarda la entrega?", "¿Puede llevar una placa?"],
    company: ["Ver precios", "¿Cómo participo?", "¿Qué pasa con las tapas?"],
    student: ["¿Por qué importa?", "¿Qué tapas sirven?", "¿Quiénes son?"],
    curious: ["¿Qué tapas sirven?", "¿Por qué importa?", "¿Cuál es la meta?"],
  },
  en: {
    resident: ["Which caps work?", "What happens to the caps?", "How do I join?"],
    manager: ["See prices", "How long is delivery?", "Can it have a plaque?"],
    company: ["See prices", "How do I join?", "What happens to the caps?"],
    student: ["Why does it matter?", "Which caps work?", "Who are you?"],
    curious: ["Which caps work?", "Why does it matter?", "What's the goal?"],
  },
};

/* ---------- idioma (para la voz y los botones rápidos) ---------- */
function detectLang(t: string, fallback: Lang = "es"): Lang {
  const s = t.toLowerCase();
  if (/[áéíóúñ¿¡]/.test(s)) return "es";
  const es = (s.match(/\b(que|como|tapa|tapas|banca|bancas|hola|quiero|puedo|donde|precio|precios|cuanto|soy|el|la|los|las|de|para|por|una|un|es|mi|tu|edificio|residente|estudiante|empresa|curios[oa]|ver|sirven|pasa|meta|participo|administro|gracias|con|en|y)\b/g) || []).length;
  const en = (s.match(/\b(what|how|cap|caps|bench|benches|hi|hello|want|can|where|price|prices|much|i'm|im|the|for|is|my|your|building|resident|student|company|curious|just|see|which|who|why|does|it|you|are|to|long|delivery|join|have|a|work|happens|goal|manager|matter|thanks|thank|and|with|of)\b/g) || []).length;
  if (en === es) return fallback;
  return en > es ? "en" : "es";
}

function detectRole(t: string): Role | null {
  const s = t.toLowerCase();
  const has = (...w: string[]) => w.some((x) => s.includes(x));
  if (has("residente", "resident", "vivo en", "i live", "vecin", "neighbor")) return "resident";
  if (has("administr", "manager", "desarroll", "developer", "property")) return "manager";
  if (has("empresa", "company", "oficina", "office", "corporat")) return "company";
  if (has("estudiante", "student", "colegio", "school", "universi")) return "student";
  if (has("curios", "curious", "solo mirando", "just looking")) return "curious";
  return null;
}

/* ---------- tipos mínimos de Web Speech API ---------- */
type SpeechRec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

const BotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 40 40" aria-hidden="true">
    <rect x="4" y="10" width="32" height="10" rx="2" fill="#0b2a3c" />
    <circle cx="11" cy="15" r="2.2" fill="#f2c230" />
    <circle cx="17" cy="15" r="2.2" fill="#e0457b" />
    <circle cx="23" cy="15" r="2.2" fill="#5cc8a8" />
    <circle cx="29" cy="15" r="2.2" fill="#149ac9" />
    <rect x="7" y="20" width="5" height="12" rx="1" fill="#0b2a3c" />
    <rect x="28" y="20" width="5" height="12" rx="1" fill="#0b2a3c" />
  </svg>
);

const SpeakerIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M4 9h4l5-4v14l-5-4H4z" />
    <path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a8.5 8.5 0 0 1 0 13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

export default function Page() {
  const [items, setItems] = useState<Item[]>([{ id: 0, from: "bot", text: TEXT.welcome, lang: "es" }]);
  const [chips, setChips] = useState<string[]>(ROLE_CHIPS.es);
  const [input, setInput] = useState("");
  const [sent, setSent] = useState(0);
  const [busy, setBusy] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [micVisible, setMicVisible] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);

  const chatRef = useRef<HTMLElement>(null);
  const nextId = useRef(1);
  const history = useRef<ApiMessage[]>([]);
  const sentRef = useRef(0);
  const busyRef = useRef(false);
  const roleRef = useRef<Role | null>(null);
  const langRef = useRef<Lang>("es");
  const recRef = useRef<SpeechRec | null>(null);
  const submitRef = useRef<(raw: string) => void>(() => {});

  const atLimit = sent >= LIMIT;

  /* ---------- envío y respuesta en streaming ---------- */
  const submit = useCallback(async (raw: string) => {
    const text = (raw || "").trim().slice(0, MAXLEN);
    if (!text || busyRef.current || sentRef.current >= LIMIT) return;

    const userLang = detectLang(text, langRef.current);
    langRef.current = userLang;
    const role = detectRole(text);
    if (role) roleRef.current = role;

    const botId = nextId.current + 1;
    const userItem: Item = { id: nextId.current, from: "user", text, lang: userLang };
    nextId.current += 2;

    busyRef.current = true;
    sentRef.current += 1;
    setBusy(true);
    setSent(sentRef.current);
    setInput("");
    setChips([]);
    setItems((prev) => [...prev, userItem, { id: botId, from: "bot", text: "", lang: userLang, pending: true }]);

    const setBot = (patch: Partial<Item>) =>
      setItems((prev) => prev.map((it) => (it.id === botId ? { ...it, ...patch } : it)));

    const messages: ApiMessage[] = [...history.current, { role: "user", content: text }];
    let full = "";
    let failure: "error" | "limit" | null = null;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (res.status === 429) failure = "limit";
      else if (!res.ok || !res.body) failure = "error";
      else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          setBot({ text: full, pending: false });
        }
        full = (full + decoder.decode()).trim();
        if (!full) failure = "error";
      }
    } catch {
      // Si el stream se corta a la mitad, se conserva lo que ya llegó.
      full = full.trim();
      if (!full) failure = "error";
    }

    if (failure) {
      setBot({ text: TEXT[failure][userLang], lang: userLang, pending: false });
      if (failure === "limit") {
        sentRef.current = LIMIT;
        setSent(LIMIT);
      } else {
        // Un fallo no gasta un mensaje de la sesión.
        sentRef.current -= 1;
        setSent(sentRef.current);
        setChips(roleRef.current ? NEXT_CHIPS[userLang][roleRef.current] : ROLE_CHIPS[userLang]);
      }
    } else {
      const answerLang = detectLang(full, userLang);
      langRef.current = answerLang;
      history.current = [...messages, { role: "assistant", content: full }];
      setBot({ text: full, lang: answerLang, pending: false });

      if (sentRef.current >= LIMIT) {
        setItems((prev) => [...prev, { id: nextId.current++, from: "bot", text: TEXT.limit[answerLang], lang: answerLang }]);
      } else {
        setChips(roleRef.current ? NEXT_CHIPS[answerLang][roleRef.current] : ROLE_CHIPS[answerLang]);
      }
    }

    busyRef.current = false;
    setBusy(false);
  }, []);

  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  /* ---------- capacidades del navegador ---------- */
  useEffect(() => {
    const browserLang: Lang = navigator.language?.toLowerCase().startsWith("en") ? "en" : "es";
    langRef.current = browserLang;
    setChips((c) => (c === ROLE_CHIPS.es ? ROLE_CHIPS[browserLang] : c));

    if ("speechSynthesis" in window) {
      setCanSpeak(true);
      window.speechSynthesis.getVoices(); // precarga la lista de voces
    }

    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRec;
      webkitSpeechRecognition?: new () => SpeechRec;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;

    let rec: SpeechRec;
    try {
      rec = new SR();
    } catch {
      return;
    }
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      const results = Array.from(e.results);
      const transcript = results.map((r) => r[0].transcript).join("");
      setInput(transcript.slice(0, MAXLEN));
      if (results[results.length - 1]?.isFinal) {
        setListening(false);
        setInput("");
        submitRef.current(transcript);
      }
    };
    rec.onerror = (e) => {
      setListening(false);
      // Permiso negado o servicio bloqueado: se oculta el micrófono y queda el texto.
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setMicVisible(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setMicVisible(true);

    return () => {
      try {
        rec.abort();
      } catch {}
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const toggleMic = () => {
    const rec = recRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      return;
    }
    try {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      setSpeakingId(null);
      rec.lang = langRef.current === "en" ? "en-US" : "es-US";
      rec.start();
      setListening(true);
    } catch {
      setMicVisible(false);
    }
  };

  /* ---------- texto a voz ---------- */
  const speak = (item: Item) => {
    try {
      const synth = window.speechSynthesis;
      if (speakingId === item.id) {
        synth.cancel();
        setSpeakingId(null);
        return;
      }
      synth.cancel();
      const u = new SpeechSynthesisUtterance(item.text.replace(/[•*#_]/g, ""));
      u.lang = item.lang === "en" ? "en-US" : "es-US";
      const voices = synth.getVoices();
      const voice =
        voices.find((v) => v.lang?.replace("_", "-").toLowerCase() === u.lang.toLowerCase()) ||
        voices.find((v) => v.lang?.toLowerCase().startsWith(item.lang));
      if (voice) u.voice = voice;
      u.onend = u.onerror = () => setSpeakingId((id) => (id === item.id ? null : id));
      setSpeakingId(item.id);
      synth.speak(u);
    } catch {
      setCanSpeak(false);
    }
  };

  /* ---------- scroll al final ---------- */
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items, chips]);

  const placeholder = atLimit
    ? "Límite alcanzado · Limit reached"
    : listening
      ? "Te escucho… / Listening…"
      : "Escribe o habla · Type or talk";

  return (
    <div className="app">
      <header>
        <div className="logos">
          <div className="logo" title="Reemplazar por el logo oficial">
            <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
              <circle cx="13" cy="13" r="12" fill="#fff" />
              <path d="M5 14c3-2 5 2 8 0s5-2 8 0" stroke="#5cc8a8" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <path d="M13 5c-3 2-3 6 0 8 3-2 3-6 0-8z" fill="#5cc8a8" />
            </svg>
            <span>
              A Cleaner Planet<small>logo aquí</small>
            </span>
          </div>
          <span className="plus">+</span>
          <div className="logo" title="Reemplazar por el logo oficial">
            <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
              <circle cx="13" cy="13" r="12" fill="#fff" />
              <path d="M6 13c3-4 9-4 12 0-3 4-9 4-12 0z" fill="#3fa9dc" />
              <path d="M18 13l3-3v6z" fill="#3fa9dc" />
              <circle cx="9.5" cy="12.3" r="1" fill="#fff" />
            </svg>
            <span>
              Plastic Fisherman<small>logo aquí</small>
            </span>
          </div>
        </div>
        <div className="hero">
          <div className="avatar" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 40 40">
              <rect x="4" y="10" width="32" height="10" rx="2" fill="#0b2a3c" />
              <g>
                <circle cx="8" cy="13" r="1.6" fill="#f2c230" />
                <circle cx="12" cy="13" r="1.6" fill="#e0457b" />
                <circle cx="16" cy="13" r="1.6" fill="#5cc8a8" />
                <circle cx="20" cy="13" r="1.6" fill="#149ac9" />
                <circle cx="24" cy="13" r="1.6" fill="#f2c230" />
                <circle cx="28" cy="13" r="1.6" fill="#e0457b" />
                <circle cx="32" cy="13" r="1.6" fill="#5cc8a8" />
                <circle cx="10" cy="17" r="1.6" fill="#149ac9" />
                <circle cx="14" cy="17" r="1.6" fill="#f2c230" />
                <circle cx="18" cy="17" r="1.6" fill="#e0457b" />
                <circle cx="22" cy="17" r="1.6" fill="#5cc8a8" />
                <circle cx="26" cy="17" r="1.6" fill="#149ac9" />
                <circle cx="30" cy="17" r="1.6" fill="#f2c230" />
              </g>
              <rect x="7" y="20" width="5" height="12" rx="1" fill="#0b2a3c" />
              <rect x="28" y="20" width="5" height="12" rx="1" fill="#0b2a3c" />
              <circle cx="9.5" cy="24" r="1.4" fill="#e0457b" />
              <circle cx="9.5" cy="28" r="1.4" fill="#5cc8a8" />
              <circle cx="30.5" cy="24" r="1.4" fill="#f2c230" />
              <circle cx="30.5" cy="28" r="1.4" fill="#149ac9" />
            </svg>
          </div>
          <div>
            <p className="kicker">Pregúntale · Ask</p>
            <h1>Cap Coach</h1>
            <p className="tag">
              <b>Save your cap a seat</b> · Guárdale un puesto a tu tapa
            </p>
          </div>
        </div>
        <svg className="waves" viewBox="0 0 760 30" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 14 Q 47.5 0 95 14 T 190 14 T 285 14 T 380 14 T 475 14 T 570 14 T 665 14 T 760 14 V30 H0z" fill="#cdeaf8" />
          <path d="M0 20 Q 47.5 8 95 20 T 190 20 T 285 20 T 380 20 T 475 20 T 570 20 T 665 20 T 760 20 V30 H0z" fill="#e6f5fc" />
        </svg>
      </header>

      <div className="strip" aria-label="Meta de la campaña">
        <div className="step">
          <i style={{ background: "#e6f5fc" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <rect x="2" y="5" width="12" height="7" rx="2" fill="#3fa9dc" />
              <rect x="2" y="3.5" width="12" height="3" rx="1.5" fill="#7cc8ec" />
            </svg>
          </i>
          19,000 tapas
        </div>
        <span className="arrow">→</span>
        <div className="step">
          <i style={{ background: "#fff6e3" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 12h10l-1.5-6h-7z" fill="#ff8a65" />
              <rect x="5" y="3" width="6" height="3" rx="1" fill="#ffb59c" />
            </svg>
          </i>
          84 lb
        </div>
        <span className="arrow">→</span>
        <div className="step">
          <i style={{ background: "#e3f7f0" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <rect x="1.5" y="6" width="13" height="3" rx="1" fill="#5cc8a8" />
              <rect x="3" y="9" width="2" height="4" fill="#3ea688" />
              <rect x="11" y="9" width="2" height="4" fill="#3ea688" />
            </svg>
          </i>
          1 Bay Bench
        </div>
      </div>

      <main className="chat" ref={chatRef} aria-live="polite">
        {items.map((it) =>
          it.from === "user" ? (
            <div className="row user" key={it.id}>
              <div className="bubble">{it.text}</div>
            </div>
          ) : (
            <div className="row bot" key={it.id}>
              <div className="mini">
                <BotIcon />
              </div>
              {it.pending ? (
                <div className="bubble typing" aria-label="Escribiendo…">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                <div>
                  <div className="bubble">{it.text}</div>
                  {canSpeak && (
                    <div className="meta">
                      <button
                        type="button"
                        className={"speak" + (speakingId === it.id ? " on" : "")}
                        onClick={() => speak(it)}
                      >
                        <SpeakerIcon /> {it.lang === "en" ? "Listen" : "Escuchar"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ),
        )}
        {chips.length > 0 && !busy && !atLimit && (
          <div className="chips">
            {chips.map((label) => (
              <button type="button" className="chip" key={label} onClick={() => submit(label)}>
                {label}
              </button>
            ))}
          </div>
        )}
      </main>

      <div className="composer">
        <form
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
        >
          <div className="field">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={MAXLEN}
              placeholder={placeholder}
              aria-label="Mensaje"
              disabled={atLimit}
            />
            {micVisible && !atLimit && (
              <button
                type="button"
                className={"round mic" + (listening ? " rec" : "")}
                onClick={toggleMic}
                aria-label={listening ? "Detener" : "Hablar"}
                aria-pressed={listening}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <line x1="12" y1="18" x2="12" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
          <button className="round send" aria-label="Enviar" disabled={!input.trim() || busy || atLimit}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M3 11.5 20 4l-7.5 17-2-7.5z" />
            </svg>
          </button>
        </form>
        <div className="sub">
          <span className="count">
            Mensajes: <b>{sent}</b> / {LIMIT}
          </span>
          <span>
            ¿Dudas? <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <span className="tagx"> · #plasticfishing</span>
          </span>
        </div>
      </div>
    </div>
  );
}
