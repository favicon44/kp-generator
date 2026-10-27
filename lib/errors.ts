export type GenerationErrorCode =
  | "invalid_input"
  | "rate_limited"
  | "auth"
  | "upstream_busy"
  | "bad_output"
  | "upstream";

/** Ошибка, которую безопасно показать пользователю: без стектрейсов и деталей API. */
export class GenerationError extends Error {
  constructor(
    public readonly code: GenerationErrorCode,
    message: string,
    public readonly status: number,
    public readonly details: string[] = [],
  ) {
    super(message);
    this.name = "GenerationError";
  }
}
