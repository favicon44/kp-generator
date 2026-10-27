import Anthropic from "@anthropic-ai/sdk";
import { GenerationError } from "./errors";
import { SYSTEM_PROMPT, TOOL_NAME, buildUserPrompt } from "./prompt";
import { draftJsonSchema, type Brief } from "./schema";

export const DEFAULT_MODEL = "claude-sonnet-5-5";

/** Пишет черновик КП. Возвращает «сырой» ответ модели — его проверяет generate.ts. */
export type DraftWriter = (brief: Brief) => Promise<unknown>;

type Options = { apiKey: string; model?: string };

export function createClaudeWriter({ apiKey, model = DEFAULT_MODEL }: Options): DraftWriter {
  const client = new Anthropic({ apiKey, maxRetries: 2, timeout: 90_000 });

  return async (brief) => {
    let response: Anthropic.Message;
    try {
      response = await client.messages.create({
        model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: [
          {
            name: TOOL_NAME,
            description: "Сохраняет черновик коммерческого предложения в заданной структуре.",
            input_schema: draftJsonSchema() as Anthropic.Tool.InputSchema,
          },
        ],
        // Принудительный вызов инструмента гарантирует структурированный JSON вместо свободного текста.
        tool_choice: { type: "tool", name: TOOL_NAME },
        messages: [{ role: "user", content: buildUserPrompt(brief) }],
      });
    } catch (error) {
      throw toGenerationError(error);
    }

    for (const block of response.content) {
      if (block.type === "tool_use" && block.name === TOOL_NAME) {
        return block.input;
      }
    }
    throw new GenerationError("bad_output", "Модель не вернула структуру КП. Попробуйте ещё раз.", 502);
  };
}

function toGenerationError(error: unknown): GenerationError {
  if (error instanceof Anthropic.APIError) {
    // Подробности пишем в серверный лог, пользователю — понятное сообщение.
    console.error(`[claude] ${error.status ?? "network"}: ${error.message}`);
    switch (error.status) {
      case 401:
      case 403:
        return new GenerationError("auth", "Сервер не смог авторизоваться в Claude API. Проверьте ANTHROPIC_API_KEY.", 500);
      case 429:
        return new GenerationError("rate_limited", "Достигнут лимит запросов к Claude API. Повторите через минуту.", 429);
      case 529:
        return new GenerationError("upstream_busy", "Claude API сейчас перегружен. Повторите через пару минут.", 503);
      default:
        break;
    }
  } else {
    console.error("[claude] unexpected error", error);
  }
  return new GenerationError("upstream", "Не удалось получить ответ от Claude API. Повторите попытку.", 502);
}
