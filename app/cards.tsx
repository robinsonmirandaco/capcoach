"use client";

import { useState } from "react";

export type Lang = "es" | "en";
export type CardKind = "caps" | "process" | "prices" | "goal" | "orgs" | "impact";

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

const T = {
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

export function VisualCard({ kind, lang }: { kind: CardKind; lang: Lang }) {
  if (kind === "process") return <ProcessCard lang={lang} />;

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
