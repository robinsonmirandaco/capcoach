"use client";

import { useState } from "react";

export type Lang = "es" | "en";
export type CardKind = "caps" | "process" | "prices" | "goal" | "orgs";

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

/** Decide qué tarjeta visual acompaña la respuesta, según la pregunta. */
export function detectCard(text: string): CardKind | null {
  const s = text.toLowerCase();
  const has = (...w: string[]) => w.some((x) => s.includes(x));
  // Temas todavía no confirmados: sin tarjeta, para no prometer nada.
  if (has("entrega", "delivery", "envío", "envio", "shipping", "placa", "plaque", "tarda", "how long", "por mes", "per month")) return null;
  if (has("precio", "price", "cuesta", "cost", "how much", "comprar", "buy")) return "prices";
  if (has("qué tapas", "que tapas", "which caps", "what caps", "sirven", "caps work", "triángulo", "triangle", "número", "numero", "number", "hdpe")) return "caps";
  if (has("proceso", "process", "qué pasa con", "que pasa con", "what happens", "taller", "workshop", "cómo se hace", "como se hace", "how is it made", "how are they made")) return "process";
  if (has("meta", "goal", "19,000", "19000", "cuántas tapas", "cuantas tapas", "how many caps")) return "goal";
  if (has("quiénes son", "quienes son", "who are", "who makes", "quién hace", "quien hace", "cleaner planet", "plastic fisherman")) return "orgs";
  return null;
}

const T = {
  caps: {
    k: { es: "Qué tapas sirven", en: "Which caps work" },
    t: { es: "Busca el número en el triángulo", en: "Look for the number in the triangle" },
    how: {
      es: ["Desenrosca", "Enjuaga", "Seca", "Deposita"],
      en: ["Twist off", "Rinse", "Dry", "Drop"],
    },
    note: {
      es: "Solo tapas y tapitas plásticas. El número suele estar por dentro o debajo de la tapa.",
      en: "Plastic caps and lids only. The number is usually on the inside or underside of the cap.",
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
    <div className="card" style={{ "--c": "#e0457b", "--c-ink": "#b02c5c" } as React.CSSProperties}>
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
      <div className="card" style={{ "--c": "#3f9b2f", "--c-ink": "#2f7a22" } as React.CSSProperties}>
        <p className="card-k">{T.caps.k[lang]}</p>
        <p className="card-t">{T.caps.t[lang]}</p>
        <div className="badges">
          {[
            ["#2", "HDPE"],
            ["#4", "LDPE"],
            ["#5", "PP"],
            ["#6", "PS"],
          ].map(([n, name]) => (
            <div className="badge" key={n}>
              <b>{n}</b>
              {name}
            </div>
          ))}
        </div>
        <ol className="how">
          {T.caps.how[lang].map((label, n) => (
            <li key={label}>
              <i>{n + 1}</i>
              {label}
            </li>
          ))}
        </ol>
        <p className="card-note">{T.caps.note[lang]}</p>
      </div>
    );
  }

  if (kind === "prices") {
    return (
      <div className="card">
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
        <p className="card-note">{T.prices.note[lang]}</p>
      </div>
    );
  }

  if (kind === "goal") {
    return (
      <div className="card" style={{ "--c": "#f2c230", "--c-ink": "#8a6a00" } as React.CSSProperties}>
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
    <div className="card">
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
