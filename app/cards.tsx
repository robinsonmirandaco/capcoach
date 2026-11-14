"use client";

import { useState } from "react";

export type Lang = "es" | "en";
export type CardKind = "caps" | "process" | "prices" | "goal" | "orgs" | "impact" | "calc" | "quiz" | "share";

/**
 * Psicología del color, con la paleta del sitio de la campaña.
 * Cada color significa siempre lo mismo, para que la persona aprenda a leerlo:
 *   grass  = acción: lo que tú puedes hacer hoy
 *   ocean  = conocimiento: cómo funciona, datos y precios
 *   sun    = meta y logro
 *   bay    = por qué importa (calma y profundidad, sin miedo)
 *   coral  = atención: lo que no va o lo que aún no está confirmado
 */
export type Tone = "grass" | "ocean" | "sun" | "bay" | "coral";
export type Topic = { tone: Tone; label: Record<Lang, string>; card: CardKind | null };

const EMAIL = "contact@plasticfisherman.com";

/** Banca arcoíris de la campaña, dibujada con CSS. */
export function Bench({ dark = false }: { dark?: boolean }) {
  return (
    <span className={"bench" + (dark ? " dark" : "")} aria-hidden="true">
      <span className="bench-seat" style={{ display: "block" }} />
      <span className="bench-legs">
        <span className="leg l" />
        <span className="leg r" />
      </span>
    </span>
  );
}

/** Decide el tono (color) y la tarjeta visual de la respuesta, según la pregunta. */
export function detectTopic(text: string): Topic | null {
  const s = text.toLowerCase();
  const has = (...w: string[]) => w.some((x) => s.includes(x));
  // Contenido interactivo: juego, calculadora, compartir y la historia de una tapa.
  if (has("juega", "juego", "jugar", "play", "game", "quiz", "sirve o no", "does it count"))
    return { tone: "grass", label: { es: "Juego", en: "Game" }, card: "quiz" };
  if (has("calcul", "do the math", "how fast", "qué tan rápido", "que tan rapido", "la cuenta"))
    return { tone: "sun", label: { es: "La cuenta", en: "The math" }, card: "calc" };
  if (has("compart", "share"))
    return { tone: "grass", label: { es: "Tu parte", en: "Your part" }, card: "share" };
  if (has("viaje", "journey", "historia de una tapa", "story"))
    return { tone: "ocean", label: { es: "El viaje de una tapa", en: "A cap's journey" }, card: "process" };
  if (has("reto", "challenge", "coach me", "mi coach"))
    return { tone: "grass", label: { es: "Tu reto", en: "Your challenge" }, card: null };
  // Temas todavía no confirmados: coral y sin tarjeta, para no prometer nada.
  if (has("entrega", "delivery", "envío", "envio", "shipping", "placa", "plaque", "tarda", "how long", "por mes", "per month"))
    return { tone: "coral", label: { es: "Por confirmar", en: "Being confirmed" }, card: null };
  if (has("precio", "price", "cuesta", "cost", "how much", "comprar", "buy"))
    return { tone: "ocean", label: { es: "Precios", en: "Prices" }, card: "prices" };
  if (has("qué tapas", "que tapas", "which caps", "what caps", "sirven", "caps work", "triángulo", "triangle", "número", "numero", "number", "hdpe"))
    return { tone: "grass", label: { es: "Lo que puedes hacer", en: "What you can do" }, card: "caps" };
  if (has("proceso", "process", "qué pasa con", "que pasa con", "what happens", "taller", "workshop", "cómo se hace", "como se hace", "how is it made", "how are they made"))
    return { tone: "ocean", label: { es: "Cómo funciona", en: "How it works" }, card: "process" };
  if (has("importa", "matter", "impacto", "impact", "ambiente", "environment", "océano", "oceano", "ocean", "microp", "planeta", "planet", "por qué reciclar", "why recycle"))
    return { tone: "bay", label: { es: "Por qué importa", en: "Why it matters" }, card: "impact" };
  if (has("meta", "goal", "19,000", "19000", "cuántas tapas", "cuantas tapas", "how many caps"))
    return { tone: "sun", label: { es: "La meta", en: "The goal" }, card: "goal" };
  if (has("quiénes son", "quienes son", "who are", "who makes", "quién hace", "quien hace", "cleaner planet", "plastic fisherman"))
    return { tone: "ocean", label: { es: "Quiénes son", en: "Who they are" }, card: "orgs" };
  if (has("particip", "join", "cómo empiezo", "como empiezo", "get started", "contenedor", "bin", "pido una banca", "order a bench", "ayudar"))
    return { tone: "grass", label: { es: "Tu parte", en: "Your part" }, card: null };
  return null;
}

/**
 * Si la pregunta no trajo tarjeta, mira lo que Cap Coach respondió.
 * Así cuenta la misión aunque la persona pregunte con sus propias palabras.
 */
export function detectFromAnswer(answer: string): Topic | null {
  const s = answer.toLowerCase();
  const numbers = /\b2\b[^.]*\b4\b[^.]*\b5\b[^.]*\b6\b/.test(s);
  if (/tri[aá]ngulo|triangle/.test(s) || numbers)
    return { tone: "grass", label: { es: "Lo que puedes hacer", en: "What you can do" }, card: "caps" };
  if (/tritur|muel|hojuela|shred|flake|grind|ground into/.test(s) && /viga|beam|fund|melt|extru/.test(s))
    return { tone: "ocean", label: { es: "Cómo funciona", en: "How it works" }, card: "process" };
  return null;
}

const QUIZ: { q: Record<Lang, string>; ok: boolean; why: Record<Lang, string> }[] = [
  {
    q: { es: "Tapa de botella de agua con un 2 en el triángulo", en: "Water bottle cap with a 2 in the triangle" },
    ok: true,
    why: { es: "Sí. El #2 (HDPE) sirve. Enjuágala y déjala secar.", en: "Yes. #2 (HDPE) counts. Rinse it and let it dry." },
  },
  {
    q: { es: "La botella de agua", en: "The water bottle itself" },
    ok: false,
    why: { es: "No. La botella es plástico #1 (PET). Aquí solo van las tapas.", en: "No. The bottle is plastic #1 (PET). Only the caps go here." },
  },
  {
    q: { es: "Tapa de metal de una gaseosa", en: "Metal cap from a soda bottle" },
    ok: false,
    why: { es: "No. Las tapas de metal no van.", en: "No. Metal caps are left out." },
  },
  {
    q: { es: "Tapa de un envase de yogur con un 5", en: "Yogurt tub lid with a 5" },
    ok: true,
    why: { es: "Sí. El #5 (PP) sirve, enjuagada y seca.", en: "Yes. #5 (PP) counts, rinsed and dry." },
  },
  {
    q: { es: "Un corcho", en: "A cork" },
    ok: false,
    why: { es: "No. Los corchos no van.", en: "No. Corks are left out." },
  },
  {
    q: { es: "Tapa plástica con restos de comida", en: "Plastic cap with food on it" },
    ok: false,
    why: { es: "Así no. Enjuágala, déjala secar y entonces sí.", en: "Not like that. Rinse it, let it dry, and then yes." },
  },
];

const T = {
  quiz: {
    k: { es: "Juego", en: "Game" },
    t: { es: "¿Sirve o no sirve?", en: "Does it count?" },
    yes: { es: "Sirve", en: "It counts" },
    no: { es: "No va", en: "Leave it out" },
    next: { es: "Siguiente", en: "Next" },
    again: { es: "Jugar otra vez", en: "Play again" },
    score: { es: "aciertos de", en: "right out of" },
    end: {
      es: ["Buen comienzo. El número en la tapa es lo que decide.", "¡Casi! Ya sabes leer una tapa.", "¡Ojo de experto! Tus tapas ya pidieron puesto."],
      en: ["Good start. The number on the cap is what decides.", "So close! You can read a cap now.", "Expert eye! Your caps have their seat saved."],
    },
    hint: { es: "Responde los seis casos para lograr la misión.", en: "Answer all six to complete the mission." },
  },
  calc: {
    k: { es: "La cuenta", en: "The math" },
    t: { es: "¿Qué tan rápido llena tu edificio una banca?", en: "How fast can your building fill a bench?" },
    apts: { es: "Apartamentos en el edificio", en: "Apartments in the building" },
    caps: { es: "Tapas por apartamento cada semana", en: "Caps per apartment each week" },
    weeks: { es: "semanas para una banca", en: "weeks to one bench" },
    year: { es: "bancas al año", en: "benches a year" },
    note: {
      es: "Es un estimado con tus propios números. Una Bay Bench lleva 19,000 tapas y piezas.",
      en: "This is an estimate from your own numbers. One Bay Bench takes 19,000 caps and pieces.",
    },
    hint: { es: "Mueve las barras con los números de tu edificio para lograr la misión.", en: "Move the sliders to your building's numbers to complete the mission." },
  },
  share: {
    k: { es: "Pasa la voz", en: "Spread the word" },
    t: { es: "Un mensaje listo para tus vecinos", en: "A message ready for your neighbors" },
    msg: {
      es: "En nuestro edificio le estamos guardando un puesto a las tapas: 19,000 tapas plásticas se convierten en una banca para todos. Enjuaga las tuyas y déjalas en el contenedor del lobby. ¿Te sumas? #plasticfishing",
      en: "Our building is saving its caps a seat: 19,000 plastic caps become a bench for everyone. Rinse yours and drop them in the lobby bin. Are you in? #plasticfishing",
    },
    share: { es: "Compartir", en: "Share" },
    copy: { es: "Copiar", en: "Copy" },
    copied: { es: "¡Copiado!", en: "Copied!" },
    manual: { es: "Mantén presionado el texto para copiarlo.", en: "Press and hold the text to copy it." },
    hint: { es: "Comparte o copia el mensaje para lograr la misión.", en: "Share or copy the message to complete the mission." },
  },
  caps: {
    k: { es: "Qué tapas sirven", en: "Which caps work" },
    t: { es: "Busca el número en el triángulo", en: "Look for the number in the triangle" },
    yesT: { es: "Así se hace", en: "How to do it" },
    yes: {
      es: ["Busca el triángulo con el número en la tapa.", "Si es 2, 4, 5 o 6, enjuágala y déjala secar.", "Déjala en el contenedor del lobby."],
      en: ["Find the triangle with the number on the cap.", "If it is 2, 4, 5 or 6, rinse it and let it dry.", "Drop it in the lobby bin."],
    },
    noT: { es: "Esto no va", en: "Leave these out" },
    no: {
      es: ["La botella misma (plástico #1, PET).", "Tapas de metal y corchos.", "Tapas sucias o con restos de comida."],
      en: ["The bottle itself (plastic #1, PET).", "Metal caps and corks.", "Dirty caps or caps with food on them."],
    },
  },
  impact: {
    k: { es: "Por qué importa", en: "Why it matters" },
    t: { es: "Una tapa, dos caminos", en: "One cap, two paths" },
    a: {
      h: { es: "Si se va a la basura", en: "If it goes in the trash" },
      steps: {
        es: ["No se descompone como la comida o las hojas", "Se rompe en pedacitos cada vez más pequeños (microplásticos)", "Puede terminar en ríos y en el mar"],
        en: ["It doesn't break down like food or leaves", "It splits into smaller and smaller bits (microplastics)", "It can end up in rivers and the ocean"],
      },
    },
    b: {
      h: { es: "Si le guardas un puesto", en: "If you save it a seat" },
      steps: {
        es: ["Va al contenedor del lobby", "Se limpia, se tritura y se funde en vigas", "Con 19,000 tapas hay una banca para todos"],
        en: ["It goes in the lobby bin", "It is cleaned, shredded and melted into beams", "19,000 caps make a bench for everyone"],
      },
    },
  },
  process: {
    k: { es: "El proceso", en: "The process" },
    t: { es: "De la tapa a la banca", en: "From cap to bench" },
    steps: [
      {
        img: "/process/clean.gif",
        n: { es: "Limpiar", en: "Clean it" },
        d: {
          es: "Las tapas llegan al taller de Opa Locka y se lavan.",
          en: "Caps arrive at the Opa Locka workshop and get washed.",
        },
      },
      {
        img: "/process/shred.gif",
        n: { es: "Triturar", en: "Shred it" },
        d: {
          es: "Se separan por color y se muelen en hojuelas.",
          en: "They are sorted by color and ground into flakes.",
        },
      },
      {
        img: "/process/melt.gif",
        n: { es: "Fundir", en: "Melt it" },
        d: {
          es: "Las hojuelas se funden a baja temperatura y se extruyen en vigas.",
          en: "The flakes are melted at low temperature and extruded into beams.",
        },
      },
      {
        img: "/process/mount.gif",
        n: { es: "Armar", en: "Mount it" },
        d: {
          es: "Con las vigas se arma la banca, por pedido.",
          en: "The beams are assembled into a bench, made to order.",
        },
      },
    ],
    credit: { es: "Imágenes: Plastic Fisherman", en: "Images: Plastic Fisherman" },
  },
  prices: {
    k: { es: "Precios · Plastic Fisherman", en: "Prices · Plastic Fisherman" },
    t: { es: "Una banca que tus vecinos ayudaron a hacer", en: "A seat your residents helped make" },
    head: { es: ["Producto", "Tamaño (in)", "Precio"], en: ["Product", "Size (in)", "Price"] },
    rows: [
      { p: { es: "The Bay Bench, 2 personas", en: "The Bay Bench, 2 people" }, s: "46 × 14 × 21", $: "$1,590" },
      { p: { es: "The Bay Bench, 4 personas", en: "The Bay Bench, 4 people" }, s: "92 × 14 × 21", $: "$2,890" },
      { p: { es: "The Plastic Fishing Station (punto de recolección)", en: "The Plastic Fishing Station (collection point)" }, s: "120 × 40", $: "$1,790" },
    ],
    store: { es: "Ver la tienda", en: "Visit the store" },
    mail: { es: "Escribir para pedir", en: "Write to order" },
    note: {
      es: "El tiempo de entrega y el envío se están confirmando.",
      en: "Delivery time and shipping are still being confirmed.",
    },
  },
  goal: {
    k: { es: "La meta de cada edificio", en: "Each building's goal" },
    of: { es: "tapas y piezas", en: "caps and pieces" },
    lb: { es: "libras de plástico", en: "pounds of plastic" },
    bench: { es: "Bay Bench", en: "Bay Bench" },
    note: {
      es: "Es una meta, no lo que ya se juntó. El avance de tu edificio está en el póster del lobby.",
      en: "This is a goal, not what's been collected. Your building's progress is on the lobby poster.",
    },
  },
  orgs: {
    k: { es: "Quiénes son", en: "Who they are" },
    t: { es: "Dos organizaciones, un océano", en: "Two organizations, one ocean" },
    stats: [
      { n: "4,774", d: { es: "libras de basura recogidas por A Cleaner Planet", en: "pounds of trash collected by A Cleaner Planet" } },
      { n: "1,500+", d: { es: "voluntarios en más de 40 limpiezas", en: "volunteers across 40+ cleanups" } },
      { n: "50K+", d: { es: "libras de plástico recolectadas por Plastic Fisherman", en: "pounds of plastic collected by Plastic Fisherman" } },
      { n: "2", d: { es: "bancas vendidas. La próxima puede ser la de tu edificio.", en: "benches sold. The next could be your building's." } },
    ],
  },
};

function ProcessCard({ lang }: { lang: Lang }) {
  const [i, setI] = useState(0);
  const steps = T.process.steps;
  const step = steps[i];
  return (
    <div className="card tone-ocean">
      <p className="card-k">{T.process.k[lang]}</p>
      <p className="card-t">{T.process.t[lang]}</p>
      <div className="steps-bar">
        <div style={{ width: `${100 - ((i + 1) / steps.length) * 100}%` }} />
      </div>
      <div className="steps">
        {steps.map((s, n) => (
          <button type="button" className="step-b" key={s.img} aria-pressed={n === i} onClick={() => setI(n)}>
            <i>{n + 1}</i>
            {s.n[lang]}
          </button>
        ))}
      </div>
      <div className="step-view">
        {/* Solo se carga el GIF del paso activo. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={step.img} src={step.img} alt="" width={132} height={74} loading="lazy" />
        <p>{step.d[lang]}</p>
      </div>
      <p className="card-note">{T.process.credit[lang]}</p>
    </div>
  );
}

type MissionProps = { lang: Lang; onDone?: () => void; pending?: boolean };

function MissionHint({ text }: { text: string }) {
  return (
    <p className="mission-hint">
      <span aria-hidden="true">★</span> {text}
    </p>
  );
}

function QuizCard({ lang, onDone, pending }: MissionProps) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const done = i >= QUIZ.length;
  const item = QUIZ[Math.min(i, QUIZ.length - 1)];
  const right = picked !== null && picked === item.ok;
  const pick = (v: boolean) => {
    if (picked !== null) return;
    setPicked(v);
    if (v === item.ok) setScore((n) => n + 1);
  };
  return (
    <div className="card tone-grass">
      <p className="card-k">
        {T.quiz.k[lang]} · {Math.min(i + 1, QUIZ.length)} / {QUIZ.length}
      </p>
      <p className="card-t">{T.quiz.t[lang]}</p>
      {done ? (
        <div className="quiz-end">
          <p className="goal-n">
            {score} <small>{T.quiz.score[lang]} {QUIZ.length}</small>
          </p>
          <p>{T.quiz.end[lang][score === QUIZ.length ? 2 : score >= 4 ? 1 : 0]}</p>
          <div className="actions">
            <button type="button" className="btn" onClick={() => { setI(0); setPicked(null); setScore(0); }}>
              {T.quiz.again[lang]}
            </button>
          </div>
        </div>
      ) : (
        <>
          {pending && i === 0 && picked === null && <MissionHint text={T.quiz.hint[lang]} />}
          <p className="quiz-q">{item.q[lang]}</p>
          <div className="quiz-btns">
            <button type="button" className={"qb yes-b" + (picked === true ? " on" : "")} disabled={picked !== null} onClick={() => pick(true)}>
              ✓ {T.quiz.yes[lang]}
            </button>
            <button type="button" className={"qb no-b" + (picked === false ? " on" : "")} disabled={picked !== null} onClick={() => pick(false)}>
              ✕ {T.quiz.no[lang]}
            </button>
          </div>
          <div aria-live="polite">
            {picked !== null && (
              <div className={"quiz-fb " + (item.ok ? "yes" : "no")}>
                <b>{right ? "🎯 " : "💡 "}</b>
                {item.why[lang]}
                <div className="actions">
                  <button type="button" className="btn primary" onClick={() => { if (i + 1 >= QUIZ.length) onDone?.(); setI(i + 1); setPicked(null); }}>
                    {T.quiz.next[lang]}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function CalcCard({ lang, onDone, pending }: MissionProps) {
  const [apts, setApts] = useState(200);
  const [caps, setCaps] = useState(5);
  // La misión se logra cuando la persona pone los números de su edificio.
  const move = (set: (n: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    set(+e.target.value);
    onDone?.();
  };
  const perWeek = apts * caps;
  const weeks = Math.ceil(19000 / perWeek);
  const perYear = (52 * perWeek) / 19000;
  return (
    <div className="card tone-sun">
      <p className="card-k">{T.calc.k[lang]}</p>
      <p className="card-t">{T.calc.t[lang]}</p>
      <label className="slider">
        <span>
          {T.calc.apts[lang]} <b>{apts}</b>
        </span>
        <input type="range" min={10} max={600} step={10} value={apts} onChange={move(setApts)} />
      </label>
      <label className="slider">
        <span>
          {T.calc.caps[lang]} <b>{caps}</b>
        </span>
        <input type="range" min={1} max={30} step={1} value={caps} onChange={move(setCaps)} />
      </label>
      <div className="stats" aria-live="polite">
        <div className="stat">
          <b>{weeks}</b>
          {T.calc.weeks[lang]}
        </div>
        <div className="stat">
          <b style={{ color: "var(--grass-ink)" }}>{perYear.toFixed(1)}</b>
          {T.calc.year[lang]}
        </div>
      </div>
      <p className="card-note">{T.calc.note[lang]}</p>
      {pending && <MissionHint text={T.calc.hint[lang]} />}
    </div>
  );
}

function ShareCard({ lang, onDone, pending }: MissionProps) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  const msg = T.share.msg[lang];
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg);
      setState("copied");
    } catch {
      setState("manual"); // dentro de un iframe el portapapeles puede estar bloqueado
    }
    onDone?.();
  };
  const share = async () => {
    try {
      await navigator.share({ text: msg });
      onDone?.();
    } catch {
      /* la persona canceló o no está permitido */
    }
  };
  return (
    <div className="card tone-grass">
      <p className="card-k">{T.share.k[lang]}</p>
      <p className="card-t">{T.share.t[lang]}</p>
      <p className="share-msg">{msg}</p>
      <div className="actions">
        {canShare && (
          <button type="button" className="btn primary" onClick={share}>
            {T.share.share[lang]}
          </button>
        )}
        <button type="button" className="btn" onClick={copy}>
          {state === "copied" ? T.share.copied[lang] : T.share.copy[lang]}
        </button>
      </div>
      {state === "manual" && <p className="card-note">{T.share.manual[lang]}</p>}
      {pending && state === "idle" && <MissionHint text={T.share.hint[lang]} />}
    </div>
  );
}

export type CardMission = "quiz" | "math" | "share";

export function VisualCard({
  kind,
  lang,
  onMission,
  done = [],
}: {
  kind: CardKind;
  lang: Lang;
  onMission?: (id: CardMission) => void;
  done?: string[];
}) {
  if (kind === "process") return <ProcessCard lang={lang} />;
  if (kind === "quiz") return <QuizCard lang={lang} onDone={() => onMission?.("quiz")} pending={!done.includes("quiz")} />;
  if (kind === "calc") return <CalcCard lang={lang} onDone={() => onMission?.("math")} pending={!done.includes("math")} />;
  if (kind === "share") return <ShareCard lang={lang} onDone={() => onMission?.("share")} pending={!done.includes("share")} />;

  if (kind === "caps") {
    return (
      <div className="card tone-grass">
        <p className="card-k">{T.caps.k[lang]}</p>
        <p className="card-t">{T.caps.t[lang]}</p>
        <div className="badges">
          {[
            ["2", "HDPE"],
            ["4", "LDPE"],
            ["5", "PP"],
            ["6", "PS"],
          ].map(([n, name]) => (
            <div className="badge" key={n}>
              <svg width="38" height="34" viewBox="0 0 40 36" aria-hidden="true">
                <path d="M20 3l17 30H3z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
                <text x="20" y="28" textAnchor="middle" fontWeight="900" fontSize="15" fill="currentColor">
                  {n}
                </text>
              </svg>
              <span className="sr">#{n} </span>
              {name}
            </div>
          ))}
        </div>
        <div className="yesno">
          <div className="yes">
            <h4>
              <i aria-hidden="true">✓</i>
              {T.caps.yesT[lang]}
            </h4>
            <ol>
              {T.caps.yes[lang].map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </div>
          <div className="no">
            <h4>
              <i aria-hidden="true">✕</i>
              {T.caps.noT[lang]}
            </h4>
            <ul>
              {T.caps.no[lang].map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "impact") {
    return (
      <div className="card tone-bay">
        <p className="card-k">{T.impact.k[lang]}</p>
        <p className="card-t">{T.impact.t[lang]}</p>
        <div className="yesno">
          <div className="no path">
            <h4>
              <span className="cap-art frag" aria-hidden="true">
                <b /> <b /> <b /> <b />
              </span>
              {T.impact.a.h[lang]}
            </h4>
            <ol>
              {T.impact.a.steps[lang].map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </div>
          <div className="yes path">
            <h4>
              <span className="cap-art" aria-hidden="true">
                <Bench dark />
              </span>
              {T.impact.b.h[lang]}
            </h4>
            <ol>
              {T.impact.b.steps[lang].map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "prices") {
    return (
      <div className="card tone-ocean">
        <p className="card-k">{T.prices.k[lang]}</p>
        <p className="card-t">{T.prices.t[lang]}</p>
        <figure className="photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/bay-bench.webp" alt="The Bay Bench" width={390} height={293} loading="lazy" />
          <figcaption>The Bay Bench · Plastic Fisherman</figcaption>
        </figure>
        <table className="prices">
          <thead>
            <tr>
              {T.prices.head[lang].map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {T.prices.rows.map((r) => (
              <tr key={r.$}>
                <td>{r.p[lang]}</td>
                <td>{r.s}</td>
                <td>{r.$}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="actions">
          <a className="btn primary" href="https://www.plasticfisherman.shop" target="_blank" rel="noopener noreferrer">
            {T.prices.store[lang]}
          </a>
          <a className="btn" href={`mailto:${EMAIL}`} target="_blank" rel="noopener noreferrer">
            {T.prices.mail[lang]}
          </a>
        </div>
        <p className="card-note warn">{T.prices.note[lang]}</p>
      </div>
    );
  }

  if (kind === "goal") {
    return (
      <div className="card tone-sun">
        <p className="card-k">{T.goal.k[lang]}</p>
        <Bench dark />
        <p className="goal-n">19,000</p>
        <div className="goal-row">
          <span>{T.goal.of[lang]}</span>
          <span>
            <b>84</b> {T.goal.lb[lang]}
          </span>
          <span>
            <b>1</b> {T.goal.bench[lang]}
          </span>
        </div>
        <p className="card-note">{T.goal.note[lang]}</p>
      </div>
    );
  }

  return (
    <div className="card tone-ocean">
      <p className="card-k">{T.orgs.k[lang]}</p>
      <p className="card-t">{T.orgs.t[lang]}</p>
      <div className="stats">
        {T.orgs.stats.map((s) => (
          <div className="stat" key={s.n}>
            <b>{s.n}</b>
            {s.d[lang]}
          </div>
        ))}
      </div>
    </div>
  );
}
