import { NextResponse, type NextRequest } from "next/server";
import { createClaudeWriter } from "@/lib/claude";
import { GenerationError } from "@/lib/errors";
import { generateProposal } from "@/lib/generate";
import { createRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY_BYTES = 32 * 1024;

const limiter = createRateLimiter({
  limit: Number(process.env.RATE_LIMIT_PER_MINUTE) || 5,
  windowMs: 60_000,
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limit = limiter(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Слишком много запросов. Повторите через ${limit.retryAfterSec} с.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Бриф слишком длинный. Сократите описания." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Некорректный JSON в запросе." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const writer = apiKey ? createClaudeWriter({ apiKey, model: process.env.CLAUDE_MODEL || undefined }) : undefined;

  try {
    const proposal = await generateProposal(body, { writer });
    return NextResponse.json({ proposal });
  } catch (error) {
    if (error instanceof GenerationError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: error.status });
    }
    console.error("[api/generate] unexpected error", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера. Повторите попытку." }, { status: 500 });
  }
}
