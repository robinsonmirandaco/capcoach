/**
 * La voz de Cap Coach, con la síntesis de voz del navegador (sin servicios extra).
 *
 * - Elige la voz más natural disponible y descarta las voces de novedad
 *   (en Mac la lista empieza con "Eddy", "Grandma", "Rocko"…).
 * - Lee por frases, con el ritmo y el tono del tema de la respuesta.
 * - Convierte símbolos y cifras en palabras para que se escuchen bien.
 */

export type Lang = "es" | "en";
export type VoiceMood = "upbeat" | "celebrate" | "clear" | "warm" | "reflective" | "calm";
export type Tone = "grass" | "ocean" | "sun" | "bay" | "coral";

// El mismo significado que los colores del chat.
export function toneToMood(tone?: Tone | null): VoiceMood {
  switch (tone) {
    case "grass":
      return "upbeat"; // acción: ánimo
    case "sun":
      return "celebrate"; // meta y logro
    case "ocean":
      return "clear"; // conocimiento: claro y pausado
    case "bay":
      return "reflective"; // por qué importa: cálido, sin prisa
    case "coral":
      return "calm"; // atención o por confirmar: tranquilo
    default:
      return "warm";
  }
}

const PROSODY: Record<VoiceMood, { rate: number; pitch: number }> = {
  upbeat: { rate: 1.05, pitch: 1.08 },
  celebrate: { rate: 1.07, pitch: 1.12 },
  clear: { rate: 0.99, pitch: 1.02 },
  warm: { rate: 1.0, pitch: 1.04 },
  reflective: { rate: 0.94, pitch: 1.0 },
  calm: { rate: 0.95, pitch: 0.98 },
};

/** Ritmo y tono de una frase: las exclamaciones suben, las preguntas se abren. */
export function prosody(mood: VoiceMood, sentence: string) {
  let { rate, pitch } = PROSODY[mood];
  const end = sentence.trim().slice(-1);
  if (end === "!") {
    pitch += 0.05;
    rate += 0.02;
  } else if (end === "?") {
    pitch += 0.03;
  }
  return { rate, pitch };
}

/* ---------- elegir la voz ---------- */

const NOVELTY =
  /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|kathy|ralph|grandma|grandpa|rocko|eddy|flo|reed|sandy|shelley)\b/i;
const GOOD = {
  es: /\b(paloma|alonso|dalia|jorge|elvira|alvaro|álvaro|ximena|paulina|m[oó]nica|juan|diego|francisca|isabela|marisol|camila|lupe|penélope|miguel)\b/i,
  en: /\b(ava|andrew|emma|brian|aria|jenny|guy|michelle|samantha|allison|zoe|evan|nathan|tom|alex|karen|daniel|moira|serena|joelle)\b/i,
};
// Miami: primero el español de EE. UU. y de América Latina.
const REGIONS = {
  es: ["es-us", "es-mx", "es-419", "es-co", "es-ar", "es-cl", "es-es"],
  en: ["en-us", "en-ca", "en-gb", "en-au", "en-ie"],
};

export function voiceScore(v: SpeechSynthesisVoice, lang: Lang): number {
  const name = v.name || "";
  const vl = (v.lang || "").replace("_", "-").toLowerCase();
  if (!vl.startsWith(lang)) return -1;
  let s = 0;
  if (/natural|neural/i.test(name)) s += 60; // voces neuronales (Edge, Windows)
  else if (/premium|enhanced|mejorada|siri/i.test(name)) s += 45; // voces descargadas (Apple)
  else if (/google/i.test(name)) s += 35; // voces de Chrome y Android
  else if (/online/i.test(name)) s += 30;
  if (NOVELTY.test(name)) s -= 50;
  if (GOOD[lang].test(name)) s += 10;
  const r = REGIONS[lang].indexOf(vl);
  if (r >= 0) s += (REGIONS[lang].length - r) * 2;
  if (v.localService === false) s += 2;
  return s;
}

export function rankVoices(all: SpeechSynthesisVoice[], lang: Lang) {
  return all
    .map((v) => ({ v, score: voiceScore(v, lang) }))
    .filter((x) => x.score >= 0) // fuera las de otro idioma y las de novedad
    .sort((a, b) => b.score - a.score);
}

/** Nombre corto para mostrar: "Microsoft Paloma Online (Natural) - Spanish (United States)" → "Paloma · Natural". */
export function voiceLabel(v: SpeechSynthesisVoice): string {
  const n = v.name || "";
  const natural = /natural|neural/i.test(n);
  let base = n
    .replace(/^Microsoft\s+/i, "")
    .replace(/\s*Online\s*\((Natural|Neural)\)/i, "")
    .replace(/\s+-\s+[^-]+$/, "")
    .replace(/\s*\((Natural|Neural)\)/i, "")
    .trim();
  if (/^google\s/i.test(base)) base = "Google · " + base.replace(/^google\s+/i, "");
  return natural ? base + " · Natural" : base;
}

export function regionLabel(v: SpeechSynthesisVoice, lang: Lang): string {
  const vl = (v.lang || "").replace("_", "-").toLowerCase();
  const names: Record<string, [string, string]> = {
    "es-us": ["EE. UU.", "US"],
    "es-mx": ["México", "Mexico"],
    "es-419": ["Latinoamérica", "Latin America"],
    "es-co": ["Colombia", "Colombia"],
    "es-ar": ["Argentina", "Argentina"],
    "es-cl": ["Chile", "Chile"],
    "es-es": ["España", "Spain"],
    "en-us": ["EE. UU.", "US"],
    "en-gb": ["Reino Unido", "UK"],
    "en-ca": ["Canadá", "Canada"],
    "en-au": ["Australia", "Australia"],
    "en-ie": ["Irlanda", "Ireland"],
  };
  const hit = names[vl];
  return hit ? hit[lang === "es" ? 0 : 1] : v.lang;
}

/* ---------- preparar el texto para la voz ---------- */

export function forSpeech(text: string, lang: Lang): string {
  const es = lang === "es";
  let t = text;
  t = t.replace(/[\p{Extended_Pictographic}️‍]/gu, "");
  t = t.replace(/[*_•]/g, " ");
  t = t.replace(/plasticfisherman/gi, "plastic fisherman").replace(/acleanerplanet/gi, "a cleaner planet");
  // correos y sitios web
  t = t.replace(/([\w.+-]+)@([\w -]+?)\.(com|org|shop|net)\b/gi, (_, u, d, tld) => `${u} ${es ? "arroba" : "at"} ${d} ${es ? "punto" : "dot"} ${tld}`);
  t = t.replace(/\b(?:https?:\/\/)?(?:www\.)?([\w -]+?)\.(com|org|shop|net)(\/\S*)?/gi, (_, d, tld) => `${d} ${es ? "punto" : "dot"} ${tld}`);
  // hashtags y números de plástico
  t = t.replace(/#plasticfishing/gi, "hashtag plastic fishing");
  t = t.replace(/#\s?(\d)/g, es ? "número $1" : "number $1");
  // cifras
  t = t.replace(/(\d+)\s?K\+/gi, es ? "más de $1 mil" : "over $1 thousand");
  t = t.replace(/\$\s?(\d[\d,]*)/g, (_, n) => `${n} ${es ? "dólares" : "dollars"}`);
  t = t.replace(/(\d[\d,]*)\+/g, es ? "más de $1" : "over $1");
  t = t.replace(/(\d),(\d{3})\b/g, "$1$2"); // 19,000 → 19000 (en español la coma es decimal)
  t = t.replace(/(\d)\s*[x×]\s*(\d)/g, es ? "$1 por $2" : "$1 by $2");
  t = t.replace(/\blbs?\b/gi, es ? "libras" : "pounds");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

/** Frases cortas: suenan más naturales y evitan que Chrome corte la voz a los 15 segundos. */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/(?<=[.!?…])\s+/)) {
    const s = raw.trim();
    if (!s) continue;
    if (s.length <= 220) {
      out.push(s);
      continue;
    }
    let buf = "";
    for (const part of s.split(/(?<=[,;:])\s+/)) {
      if ((buf + " " + part).length > 180 && buf) {
        out.push(buf.trim());
        buf = part;
      } else buf = buf ? buf + " " + part : part;
    }
    if (buf) out.push(buf.trim());
  }
  return out;
}

export const SAMPLE: Record<Lang, string> = {
  es: "¡Vamos con todo! Cada tapa que guardas es una viga más para tu banca. ¿Empezamos hoy?",
  en: "Let's go! Every cap you save is one more beam for your bench. Shall we start today?",
};
