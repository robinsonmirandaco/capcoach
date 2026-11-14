import { readFile } from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-haiku-5-5";
const MAX_TOKENS = 300;
const MAX_USER_MESSAGES = 20;
const MAX_USER_CHARS = 300;
const MAX_ASSISTANT_CHARS = 2000;

const LIMIT_MESSAGE = "Para seguir, escríbenos a contact@plasticfisherman.com.";
const ERROR_MESSAGE = "Ups, no pude responder. Escríbenos a contact@plasticfisherman.com.";

let systemPromptCache: Promise<string> | null = null;
function getSystemPrompt(): Promise<string> {
  systemPromptCache ??= readFile(
    path.join(process.cwd(), "config", "cap-coach-system-prompt.txt"),
    "utf8",
  );
  return systemPromptCache;
}

// Misiones de la interfaz. El navegador manda cuáles completó la persona,
// para que Cap Coach pueda acompañar su avance.
const MISSIONS: Record<string, string> = {
  caps: "aprender a leer una tapa",
  quiz: "pasar el juego ¿sirve o no?",
  journey: "seguir el viaje de una tapa",
  math: "hacer la cuenta de su edificio",
  share: "pasar la voz",
};

function progressNote(body: unknown): string {
  const raw = (body as { done?: unknown } | null)?.done;
  const done = Array.isArray(raw) ? Object.keys(MISSIONS).filter((id) => raw.includes(id)) : [];
  const pending = Object.keys(MISSIONS).filter((id) => !done.includes(id));
  const list = (ids: string[]) => (ids.length ? ids.map((id) => MISSIONS[id]).join("; ") : "ninguna");
  return `\n\nAVANCE DE ESTA PERSONA EN LAS MISIONES\nCompletadas: ${list(done)}.\nPendientes: ${list(pending)}.`;
}

function json(status: number, error: string) {
  return Response.json({ error }, { status });
}

/** Valida y limpia el historial que manda el navegador. Devuelve null si no es válido. */
function parseMessages(body: unknown): Anthropic.MessageParam[] | null {
  const raw = (body as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_USER_MESSAGES * 2) return null;

  const messages: Anthropic.MessageParam[] = [];
  for (let i = 0; i < raw.length; i++) {
    const m = raw[i] as { role?: unknown; content?: unknown } | null;
    // Deben alternar usuario / asistente, empezando y terminando por el usuario.
    const expected = i % 2 === 0 ? "user" : "assistant";
    if (!m || m.role !== expected || typeof m.content !== "string") return null;
    const content = m.content
      .trim()
      .slice(0, expected === "user" ? MAX_USER_CHARS : MAX_ASSISTANT_CHARS);
    if (!content) return null;
    messages.push({ role: expected, content });
  }
  if (messages[messages.length - 1].role !== "user") return null;
  return messages;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, ERROR_MESSAGE);
  }

  // Límite por sesión, validado también en el servidor.
  const rawMessages = (body as { messages?: unknown } | null)?.messages;
  if (
    Array.isArray(rawMessages) &&
    rawMessages.filter((m) => (m as { role?: unknown } | null)?.role === "user").length >
      MAX_USER_MESSAGES
  ) {
    return json(429, LIMIT_MESSAGE);
  }

  const messages = parseMessages(body);
  if (!messages) return json(400, ERROR_MESSAGE);

  try {
    const system = (await getSystemPrompt()) + progressNote(body);
    const client = new Anthropic(); // lee ANTHROPIC_API_KEY del entorno del servidor

    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      // Respuestas cortas de preguntas frecuentes: sin razonamiento extendido,
      // para que los 300 tokens sean todos de respuesta y llegue rápido.
      thinking: { type: "disabled" },
      system,
      messages,
    });

    // Espera el primer evento antes de responder: si la llave falta o la API
    // falla, el navegador recibe un error HTTP real y no un stream vacío.
    const events = stream[Symbol.asyncIterator]();
    const first = await events.next();

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for (let r = first; !r.done; r = await events.next()) {
            const event = r.value;
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          console.error("[cap-coach] stream error", err);
          controller.error(err);
        }
      },
      cancel() {
        stream.abort();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("[cap-coach] ANTHROPIC_API_KEY inválida o ausente");
    } else if (err instanceof Anthropic.RateLimitError) {
      console.error("[cap-coach] límite de la API alcanzado");
    } else if (err instanceof Anthropic.APIError) {
      console.error("[cap-coach] error de la API", err.status, err.message);
    } else {
      console.error("[cap-coach] error", err);
    }
    return json(502, ERROR_MESSAGE);
  }
}
