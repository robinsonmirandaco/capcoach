"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bench, VisualCard, detectTopic, type CardKind, type Lang, type Topic } from "./cards";

const LIMIT = 20;
const MAXLEN = 300;
const EMAIL = "contact@plasticfisherman.com";
const WELCOME_ID = 0;

type Role = "resident" | "manager" | "company" | "student" | "curious";
type Item = {
  id: number;
  from: "user" | "bot";
  text: string;
  lang: Lang;
  pending?: boolean;
  spoken?: boolean;
  card?: CardKind | null;
  topic?: Topic | null;
};
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
  welcome: {
    es: "¡Hola! Soy Cap Coach. Te cuento cómo 19,000 tapas se convierten en una banca. ¿Quién me escribe?",
    en: "Hi! I'm Cap Coach. I can tell you how 19,000 caps become a bench. Who's visiting today?",
  },
  kicker: { es: "Guárdale un puesto a tu tapa", en: "Save your cap a seat" },
  title: { es: "Pregúntale a Cap Coach.", en: "Ask Cap Coach." },
  sub: {
    es: "Una tapa parece poca cosa. 19,000 son una banca donde te puedes sentar.",
    en: "One bottle cap looks like nothing. 19,000 caps are a bench you can sit on.",
  },
  stats: {
    es: ["tapas", "libras", "banca"],
    en: ["caps", "pounds", "bench"],
  },
  placeholder: { es: "Escribe o habla", en: "Type or talk" },
  placeholderNoMic: { es: "Escribe tu pregunta", en: "Type your question" },
  listening: { es: "Te escucho…", en: "Listening…" },
  limitReached: { es: "Límite alcanzado", en: "Limit reached" },
  listen: { es: "Escuchar", en: "Listen" },
  stop: { es: "Detener", en: "Stop" },
  messages: { es: "Mensajes", en: "Messages" },
  questions: { es: "¿Dudas?", en: "Questions?" },
  send: { es: "Enviar", en: "Send" },
  talk: { es: "Hablar", en: "Talk" },
  typing: { es: "Escribiendo…", en: "Typing…" },
  newChat: { es: "Nuevo chat", en: "New chat" },
  tagline: { es: "Guárdale un puesto a tu tapa", en: "Save Your Cap a Seat" },
  tapToTalk: { es: "Toca para hablar", en: "Tap to talk" },
  listeningStop: { es: "Te escucho… toca para terminar", en: "Listening… tap to stop" },
  thinking: { es: "Cap Coach está pensando…", en: "Cap Coach is thinking…" },
  speakingNow: { es: "Hablando", en: "Speaking" },
  spoken: { es: "Por voz", en: "Spoken" },
  orType: { es: "O escribe tu pregunta", en: "Or type your question" },
  voiceOn: { es: "Cap Coach lee las respuestas en voz alta", en: "Cap Coach reads answers aloud" },
  switchRole: { es: "Cambiar perfil", en: "Switch profile" },
};

const ROLES: { role: Role; color: string; label: Record<Lang, string>; send: Record<Lang, string>; icon: React.ReactNode }[] = [
  {
    role: "resident",
    color: "#3a9a22",
    label: { es: "Residente", en: "Resident" },
    send: { es: "Soy residente de un edificio", en: "I'm a building resident" },
    icon: <path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />,
  },
  {
    role: "manager",
    color: "#0f8fc9",
    label: { es: "Administro un edificio", en: "Building manager" },
    send: { es: "Administro un edificio", en: "I'm a building manager" },
    icon: <path d="M5 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v5h3a1 1 0 0 1 1 1v11zm3-13h2V6H8zm0 4h2v-2H8zm0 4h2v-2H8zm4-8h1V6h-1zm0 4h1v-2h-1zm3 4h2v-2h-2z" />,
  },
  {
    role: "company",
    color: "#0a4a68",
    label: { es: "Empresa", en: "Company" },
    send: { es: "Escribo de parte de una empresa", en: "I'm writing on behalf of a company" },
    icon: <path d="M9 4h6a1 1 0 0 1 1 1v2h4a1 1 0 0 1 1 1v4H3V8a1 1 0 0 1 1-1h4V5a1 1 0 0 1 1-1zm1 3h4V6h-4zM3 14h8v2h2v-2h8v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />,
  },
  {
    role: "student",
    color: "#ef4f6b",
    label: { es: "Estudiante", en: "Student" },
    send: { es: "Soy estudiante", en: "I'm a student" },
    icon: <path d="M12 4 2 9l10 5 8-4v6h2V9zM6 13.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-3.5l-6 3z" />,
  },
  {
    role: "curious",
    color: "#e0aa1c",
    label: { es: "Solo curiosidad", en: "Just curious" },
    send: { es: "Solo tengo curiosidad", en: "I'm just curious" },
    icon: <path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2zM9 20h6v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z" />,
  },
];

const NEXT_CHIPS: Record<Lang, Record<Role, string[]>> = {
  es: {
    resident: ["¿Qué tapas sirven?", "Juega: ¿sirve o no?", "El viaje de una tapa", "¿Cómo participo?", "Comparte la campaña", "¿Por qué importa?"],
    manager: ["Ver precios", "Calcula tu edificio", "¿Cómo pido una banca?", "¿Cuál es la meta?", "El viaje de una tapa", "Comparte la campaña"],
    company: ["Ver precios", "Calcula tu oficina", "¿Cómo participo?", "El viaje de una tapa", "¿Por qué importa?"],
    student: ["El viaje de una tapa", "¿Por qué importa?", "Juega: ¿sirve o no?", "¿Quiénes son?", "¿Cuál es la meta?"],
    curious: ["El viaje de una tapa", "Juega: ¿sirve o no?", "¿Por qué importa?", "¿Cuál es la meta?", "¿Quiénes son?"],
  },
  en: {
    resident: ["Which caps work?", "Play: does it count?", "A cap's journey", "How do I join?", "Share the campaign", "Why does it matter?"],
    manager: ["See prices", "Do the math for your building", "How do I order a bench?", "What's the goal?", "A cap's journey", "Share the campaign"],
    company: ["See prices", "Do the math for your office", "How do I join?", "A cap's journey", "Why does it matter?"],
    student: ["A cap's journey", "Why does it matter?", "Play: does it count?", "Who are you?", "What's the goal?"],
    curious: ["A cap's journey", "Play: does it count?", "Why does it matter?", "What's the goal?", "Who are you?"],
  },
};
const CHIPS_SHOWN = 3;

/* ---------- idioma (para la voz y los botones rápidos) ---------- */
function detectLang(t: string, fallback: Lang): Lang {
  const s = t.toLowerCase();
  if (/[áéíóúñ¿¡]/.test(s)) return "es";
  const es = (s.match(/\b(que|como|tapa|tapas|banca|bancas|hola|quiero|puedo|donde|precio|precios|cuanto|soy|el|la|los|las|de|para|por|una|un|es|mi|tu|edificio|residente|estudiante|empresa|curios[oa]|curiosidad|ver|sirven|pasa|meta|participo|administro|gracias|con|en|y|solo|tengo|escribo)\b/g) || []).length;
  const en = (s.match(/\b(what|how|cap|caps|bench|benches|hi|hello|want|can|where|price|prices|much|i'm|im|the|for|is|my|your|building|resident|student|company|curious|just|see|which|who|why|does|it|you|are|to|long|delivery|join|have|a|work|happens|goal|manager|matter|thanks|thank|and|with|of|do|order)\b/g) || []).length;
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

const SpeakerIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M4 9h4l5-4v14l-5-4H4z" />
    <path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a8.5 8.5 0 0 1 0 13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

export default function Page() {
  const [items, setItems] = useState<Item[]>([{ id: WELCOME_ID, from: "bot", text: "", lang: "es" }]);
  const [lang, setLangState] = useState<Lang>("es");
  const [role, setRole] = useState<Role | null>(null);
  const [used, setUsed] = useState<number[]>([]); // botones rápidos ya usados (por posición)
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
  const langRef = useRef<Lang>("es");
  const recRef = useRef<SpeechRec | null>(null);
  const submitRef = useRef<(raw: string, via?: "voice") => void>(() => {});
  const genRef = useRef(0);
  const [voiceOut, setVoiceOut] = useState(true); // leer las respuestas en voz alta
  const voiceOutRef = useRef(true);
  const [heard, setHeard] = useState(""); // lo que el micrófono va entendiendo
  const speakRef = useRef<(id: number, text: string, l: Lang, auto?: boolean) => void>(() => {});
  const speakingRef = useRef<number | null>(null);
  const unlockedRef = useRef(false);

  const atLimit = sent >= LIMIT;

  const setLang = useCallback((l: Lang) => {
    langRef.current = l;
    setLangState(l);
  }, []);

  /* ---------- envío y respuesta en streaming ---------- */
  const submit = useCallback(
    async (raw: string, via?: "voice") => {
      const text = (raw || "").trim().slice(0, MAXLEN);
      if (!text || busyRef.current || sentRef.current >= LIMIT) return;

      // En iOS la voz solo suena si se activó antes con un toque de la persona.
      if (!unlockedRef.current && "speechSynthesis" in window) {
        unlockedRef.current = true;
        try {
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
        } catch {}
      }
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      speakingRef.current = null;
      setSpeakingId(null);

      const userLang = detectLang(text, langRef.current);
      setLang(userLang);
      const newRole = detectRole(text);
      if (newRole) setRole((cur) => cur ?? newRole);
      const gen = genRef.current;
      const topic = detectTopic(text);
      const card = topic?.card ?? null;

      const botId = nextId.current + 1;
      const userItem: Item = { id: nextId.current, from: "user", text, lang: userLang, spoken: via === "voice" };
      nextId.current += 2;

      busyRef.current = true;
      sentRef.current += 1;
      setBusy(true);
      setSent(sentRef.current);
      setInput("");
      setItems((prev) => [...prev, userItem, { id: botId, from: "bot", text: "", lang: userLang, pending: true, topic }]);

      const setBot = (patch: Partial<Item>) =>
        setItems((prev) => prev.map((it) => (it.id === botId ? { ...it, ...patch } : it)));
      const stale = () => genRef.current !== gen; // la persona empezó un chat nuevo mientras llegaba la respuesta

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
            if (stale()) {
              reader.cancel().catch(() => {});
              return;
            }
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

      if (stale()) return;

      if (failure) {
        setBot({ text: TEXT[failure][userLang], lang: userLang, pending: false, topic: null });
        if (failure === "limit") {
          sentRef.current = LIMIT;
        } else {
          sentRef.current -= 1; // un fallo no gasta un mensaje de la sesión
        }
        setSent(sentRef.current);
      } else {
        const answerLang = detectLang(full, userLang);
        setLang(answerLang);
        history.current = [...messages, { role: "assistant", content: full }];
        setBot({ text: full, lang: answerLang, pending: false, card });
        if (voiceOutRef.current) speakRef.current(botId, full, answerLang, true);
        if (sentRef.current >= LIMIT) {
          setItems((prev) => [...prev, { id: nextId.current++, from: "bot", text: TEXT.limit[answerLang], lang: answerLang }]);
        }
      }

      busyRef.current = false;
      setBusy(false);
    },
    [setLang],
  );

  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  /* ---------- volver al inicio ---------- */
  // Empieza una conversación nueva. El contador de mensajes de la sesión se conserva.
  const newChat = () => {
    genRef.current += 1;
    busyRef.current = false;
    history.current = [];
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    speakingRef.current = null;
    setSpeakingId(null);
    setBusy(false);
    setItems([{ id: WELCOME_ID, from: "bot", text: "", lang }]);
    setRole(null);
    setUsed([]);
    setInput("");
  };
  // Vuelve a mostrar las tarjetas de perfil sin borrar la conversación.
  const switchRole = () => {
    setRole(null);
    setUsed([]);
  };
  const pickRole = (r: Role, text: string) => {
    setRole(r);
    submit(text);
  };

  /* ---------- capacidades del navegador ---------- */
  useEffect(() => {
    if (navigator.language?.toLowerCase().startsWith("en")) setLang("en");
    try {
      if (localStorage.getItem("capcoach-voice") === "off") {
        voiceOutRef.current = false;
        setVoiceOut(false);
      }
    } catch {}

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
      setHeard(transcript.slice(0, MAXLEN));
      if (results[results.length - 1]?.isFinal) {
        setListening(false);
        setHeard("");
        submitRef.current(transcript, "voice");
      }
    };
    rec.onerror = (e) => {
      setListening(false);
      // Permiso negado o servicio bloqueado: se oculta el micrófono y queda el texto.
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setMicVisible(false);
    };
    rec.onend = () => {
      setListening(false);
      setHeard("");
    };
    recRef.current = rec;
    setMicVisible(true);

    return () => {
      try {
        rec.abort();
      } catch {}
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [setLang]);

  const toggleMic = () => {
    const rec = recRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      return;
    }
    try {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      speakingRef.current = null;
      setSpeakingId(null);
      setHeard("");
      rec.lang = langRef.current === "en" ? "en-US" : "es-US";
      rec.start();
      setListening(true);
    } catch {
      setMicVisible(false);
    }
  };

  /* ---------- texto a voz ---------- */
  const speak = (id: number, text: string, l: Lang, auto = false) => {
    if (!("speechSynthesis" in window)) return;
    try {
      const synth = window.speechSynthesis;
      if (!auto && speakingRef.current === id) {
        synth.cancel();
        speakingRef.current = null;
        setSpeakingId(null);
        return;
      }
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[•*#_]/g, ""));
      u.lang = l === "en" ? "en-US" : "es-US";
      const voices = synth.getVoices();
      const voice =
        voices.find((v) => v.lang?.replace("_", "-").toLowerCase() === u.lang.toLowerCase()) ||
        voices.find((v) => v.lang?.toLowerCase().startsWith(l));
      if (voice) u.voice = voice;
      u.onend = u.onerror = () => {
        if (speakingRef.current === id) {
          speakingRef.current = null;
          setSpeakingId(null);
        }
      };
      speakingRef.current = id;
      setSpeakingId(id);
      synth.speak(u);
    } catch {
      setCanSpeak(false);
    }
  };
  useEffect(() => {
    speakRef.current = speak;
  });

  const toggleVoiceOut = () => {
    const next = !voiceOut;
    voiceOutRef.current = next;
    setVoiceOut(next);
    try {
      localStorage.setItem("capcoach-voice", next ? "on" : "off");
    } catch {}
    if (!next && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      speakingRef.current = null;
      setSpeakingId(null);
    }
  };

  /* ---------- scroll al final ---------- */
  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    // Si la respuesta y su tarjeta no caben, se muestra desde la pregunta y no desde el final.
    const asked = el.querySelectorAll<HTMLElement>(".row.user");
    const last = asked[asked.length - 1];
    if (last && el.scrollHeight - last.offsetTop > el.clientHeight) el.scrollTop = last.offsetTop - 10;
    else el.scrollTop = el.scrollHeight;
  }, [items, busy, role, lang]);

  const placeholder = atLimit ? TEXT.limitReached[lang] : micVisible ? TEXT.orType[lang] : TEXT.placeholderNoMic[lang];
  const status = listening
    ? heard || TEXT.listeningStop[lang]
    : busy
      ? TEXT.thinking[lang]
      : speakingId !== null
        ? TEXT.speakingNow[lang] + "…"
        : TEXT.tapToTalk[lang];

  const showQuick = !busy && !atLimit;

  return (
    <div className="app" lang={lang}>
      <header className="top">
        <span className="avatar" aria-hidden="true">
          <Bench />
        </span>
        <div className="who">
          <h1>Cap Coach</h1>
          <p>{TEXT.tagline[lang]}</p>
        </div>
        <div className="right">
          {items.length > 1 && (
            <button type="button" className="icon" onClick={newChat} aria-label={TEXT.newChat[lang]} title={TEXT.newChat[lang]}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12a8 8 0 1 0 2.6-5.9" />
                <path d="M4 4v5h5" />
              </svg>
            </button>
          )}
          <div className="pill" role="group" aria-label="Idioma · Language">
            <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
              EN
            </button>
            <button type="button" aria-pressed={lang === "es"} onClick={() => setLang("es")}>
              ES
            </button>
          </div>
          {canSpeak && (
            <button type="button" className="icon" aria-pressed={voiceOut} aria-label={TEXT.voiceOn[lang]} title={TEXT.voiceOn[lang]} onClick={toggleVoiceOut}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 9v6h4l5 4V5L8 9z" />
                {voiceOut ? <path d="M17 9a4 4 0 0 1 0 6" /> : <path d="M17 9l5 6M22 9l-5 6" />}
              </svg>
            </button>
          )}
        </div>
      </header>

      <div className="facts">
        <span>
          <b>19,000</b> {TEXT.stats[lang][0]}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          <b>84</b> {TEXT.stats[lang][1]}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          <b>1</b> {TEXT.stats[lang][2]}
        </span>
        <i className="facts-bar" aria-hidden="true" />
      </div>

      <main className="chat" ref={chatRef} aria-live="polite">
        {items.map((it) => {
          if (it.from === "user") {
            return (
              <div className="row user" key={it.id}>
                <div className="bubble">
                  {it.spoken && <span className="via">{TEXT.spoken[lang]}</span>}
                  {it.text}
                </div>
              </div>
            );
          }
          const isWelcome = it.id === WELCOME_ID;
          const text = isWelcome ? TEXT.welcome[lang] : it.text;
          const itemLang = isWelcome ? lang : it.lang;
          return (
            <div className="row bot" key={it.id}>
              <div className="mini">
                <Bench />
              </div>
              {it.pending ? (
                <div className="bubble typing" aria-label={TEXT.typing[lang]}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                <div className="col">
                  {it.topic && (
                    <span className={"tone tone-" + it.topic.tone}>
                      <i aria-hidden="true" />
                      {it.topic.label[lang]}
                    </span>
                  )}
                  <div className={"bubble" + (it.topic ? " toned tone-" + it.topic.tone : "")}>{text}</div>
                  {it.card && <VisualCard kind={it.card} lang={itemLang} />}
                  {canSpeak && (
                    <button
                      type="button"
                      className={"speak" + (speakingId === it.id ? " on" : "")}
                      onClick={() => speak(it.id, text, itemLang)}
                      aria-pressed={speakingId === it.id}
                    >
                      {speakingId === it.id ? (
                        <>
                          <span className="bars" aria-hidden="true">
                            <i />
                            <i />
                            <i />
                            <i />
                          </span>
                          {TEXT.speakingNow[lang]}
                        </>
                      ) : (
                        <>
                          <SpeakerIcon /> {TEXT.listen[lang]}
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {showQuick && !role && (
          <div className="roles">
            {ROLES.map((r) => (
              <button
                type="button"
                className="role"
                key={r.role}
                style={{ "--c": r.color } as React.CSSProperties}
                onClick={() => pickRole(r.role, r.send[lang])}
              >
                <i>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    {r.icon}
                  </svg>
                </i>
                {r.label[lang]}
              </button>
            ))}
          </div>
        )}
        {showQuick && role && (
          <div className="chips">
            {NEXT_CHIPS[lang][role]
              .map((label, n) => ({ label, n }))
              .filter((c) => !used.includes(c.n))
              .slice(0, CHIPS_SHOWN)
              .map(({ label, n }) => (
                <button
                  type="button"
                  className="chip"
                  key={label}
                  onClick={() => {
                    setUsed((u) => [...u, n]);
                    submit(label);
                  }}
                >
                  {label}
                </button>
              ))}
            <button type="button" className="chip ghost" onClick={switchRole}>
              ↺ {TEXT.switchRole[lang]}: {ROLES.find((r) => r.role === role)?.label[lang]}
            </button>
          </div>
        )}
      </main>

      <footer className={"dock" + (listening ? " live" : "")}>
        {micVisible && !atLimit && (
          <div className="talk">
            <div className="orb-wrap">
              <span className="ring" />
              <span className="ring" />
              <button type="button" className="orb" onClick={toggleMic} aria-pressed={listening} aria-label={listening ? TEXT.stop[lang] : TEXT.talk[lang]}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                </svg>
              </button>
            </div>
            <div className="status" aria-live="polite">
              {listening && (
                <span className="wave" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              )}
              {status}
            </div>
          </div>
        )}
        <form
          className="row-in"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={MAXLEN}
            placeholder={placeholder}
            aria-label={TEXT.placeholderNoMic[lang]}
            disabled={atLimit}
          />
          <button className="send" aria-label={TEXT.send[lang]} disabled={!input.trim() || busy || atLimit}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </form>
        <div className="sub">
          <span className="count">
            <span className="meter" aria-hidden="true">
              <span style={{ width: `${100 - (sent / LIMIT) * 100}%` }} />
            </span>
            <span>
              {TEXT.messages[lang]}: <b>{sent}</b> / {LIMIT}
            </span>
          </span>
          <span>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <span className="tagx"> · #plasticfishing</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
