import type { DraftWriter } from "./claude";
import { buildDemoDraft } from "./demo";
import { GenerationError } from "./errors";
import { buildMeta, buildPricing } from "./pricing";
import { BriefSchema, DraftSchema, formatIssues, type Draft, type Proposal } from "./schema";

type Deps = {
  /** Если writer не передан — работает демо-режим. */
  writer?: DraftWriter;
  now?: Date;
};

/** Сколько раз переспрашиваем модель, если она вернула структуру, не прошедшую проверку. */
const OUTPUT_ATTEMPTS = 2;

export async function generateProposal(input: unknown, { writer, now = new Date() }: Deps = {}): Promise<Proposal> {
  const parsed = BriefSchema.safeParse(input);
  if (!parsed.success) {
    throw new GenerationError("invalid_input", "Проверьте бриф: часть полей заполнена неверно.", 400, formatIssues(parsed.error));
  }
  const brief = parsed.data;

  const draft = writer ? await writeValidDraft(writer, brief) : buildDemoDraft(brief);

  return {
    ...draft,
    source: writer ? "ai" : "demo",
    meta: buildMeta(brief, now),
    pricing: buildPricing(brief),
  };
}

async function writeValidDraft(writer: DraftWriter, brief: Parameters<DraftWriter>[0]): Promise<Draft> {
  for (let attempt = 1; attempt <= OUTPUT_ATTEMPTS; attempt++) {
    const raw = await writer(brief);
    const result = DraftSchema.safeParse(raw);
    if (result.success) return result.data;
    console.warn(`[generate] попытка ${attempt}: ответ модели не прошёл проверку`, formatIssues(result.error));
  }
  throw new GenerationError("bad_output", "Модель вернула неполное КП. Попробуйте сгенерировать ещё раз.", 502);
}
