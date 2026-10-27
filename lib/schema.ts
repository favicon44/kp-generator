import { z } from "zod/v4";

/**
 * Единый источник правды для данных приложения:
 * - BriefSchema — что пользователь вводит в форму (проверяется на сервере);
 * - DraftSchema — что возвращает Claude (из неё же строится JSON Schema для tool use);
 * - Proposal — итоговое КП: текст от Claude + цифры из брифа, посчитанные кодом.
 */

const text = (label: string, max: number) =>
  z
    .string({ error: `Поле «${label}» должно быть текстом` })
    .trim()
    .min(1, { error: `Заполните поле «${label}»` })
    .max(max, { error: `Поле «${label}»: не больше ${max} символов` });

const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Поле «${label}»: не больше ${max} символов` })
    .optional()
    .transform((value) => (value ? value : undefined));

export const CURRENCIES = ["RUB", "USD", "EUR"] as const;
export const TONES = ["formal", "friendly", "concise"] as const;

export const TONE_LABELS: Record<(typeof TONES)[number], string> = {
  formal: "Официальный",
  friendly: "Деловой, но тёплый",
  concise: "Коротко и по делу",
};

export const PriceItemSchema = z.object({
  name: text("Позиция", 120),
  amount: z
    .number({ error: "Сумма должна быть числом" })
    .finite()
    .min(0, { error: "Сумма не может быть отрицательной" })
    .max(1_000_000_000, { error: "Слишком большая сумма" }),
});

export const BriefSchema = z.object({
  client: z.object({
    name: text("Компания клиента", 120),
    about: text("Кто клиент", 1200),
    contact: optionalText("Кому адресовано", 120),
  }),
  task: text("Задача и боль клиента", 2000),
  product: z.object({
    name: text("Название продукта или услуги", 120),
    description: text("Что входит и как работает", 2000),
  }),
  terms: text("Условия", 1500),
  pricing: z.object({
    currency: z.enum(CURRENCIES, { error: "Неизвестная валюта" }),
    items: z
      .array(PriceItemSchema)
      .min(1, { error: "Добавьте хотя бы одну позицию стоимости" })
      .max(12, { error: "Не больше 12 позиций стоимости" }),
  }),
  sender: z.object({
    company: text("Ваша компания", 120),
    person: optionalText("Имя и должность", 120),
    contacts: optionalText("Контакты", 200),
  }),
  tone: z.enum(TONES).default("friendly"),
});

export type Brief = z.infer<typeof BriefSchema>;
export type BriefInput = z.input<typeof BriefSchema>;
export type Currency = (typeof CURRENCIES)[number];
export type Tone = (typeof TONES)[number];

/** Структура, которую генерирует Claude. Цифр стоимости здесь нет намеренно. */
export const DraftSchema = z.object({
  title: z.string().min(1).max(140).describe("Заголовок КП: что получит клиент, без слова «коммерческое предложение»"),
  lead: z.string().min(1).max(320).describe("Одно-два предложения: главная ценность для клиента"),
  understanding: z.string().min(1).max(1000).describe("Как мы понимаем ситуацию и задачу клиента, его словами"),
  pains: z
    .array(z.string().min(1).max(220))
    .min(2)
    .max(5)
    .describe("Конкретные проблемы клиента, которые решает предложение"),
  solution: z.object({
    summary: z.string().min(1).max(700).describe("Суть решения в 2–3 предложениях"),
    points: z.array(z.string().min(1).max(220)).min(2).max(6).describe("Что именно входит в решение"),
  }),
  benefits: z
    .array(
      z.object({
        title: z.string().min(1).max(90).describe("Выгода в терминах результата клиента"),
        description: z.string().min(1).max(320).describe("Почему это важно именно этому клиенту"),
      }),
    )
    .min(3)
    .max(5),
  stages: z
    .array(
      z.object({
        title: z.string().min(1).max(90),
        description: z.string().min(1).max(320),
        duration: z.string().min(1).max(40).describe("Срок этапа, только если он следует из условий; иначе «по согласованию»"),
        result: z.string().min(1).max(200).describe("Что клиент получает по итогам этапа"),
      }),
    )
    .min(2)
    .max(7),
  pricingComment: z
    .string()
    .min(1)
    .max(600)
    .describe("Что входит в стоимость и условия оплаты. Не называй суммы — таблица цен строится отдельно"),
  guarantees: z.array(z.string().min(1).max(220)).max(4).describe("Гарантии и снижение рисков — только из условий брифа"),
  nextStep: z.object({
    action: z.string().min(1).max(120).describe("Одно конкретное действие для клиента"),
    details: z.string().min(1).max(320).describe("Как и когда его сделать, что будет дальше"),
  }),
  closing: z.string().min(1).max(300).describe("Короткая завершающая фраза без канцелярита"),
});

export type Draft = z.infer<typeof DraftSchema>;

export type PricingLine = { name: string; amount: number };

export type Proposal = Draft & {
  source: "ai" | "demo";
  meta: {
    clientName: string;
    contact?: string;
    sender: Brief["sender"];
    productName: string;
    /** ISO-дата составления */
    issuedAt: string;
    /** ISO-дата, до которой действует предложение */
    validUntil: string;
  };
  pricing: {
    currency: Currency;
    items: PricingLine[];
    total: number;
  };
};

/** JSON Schema черновика для инструмента Claude (tool use). */
export function draftJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(DraftSchema) as Record<string, unknown>;
  delete schema.$schema;
  return schema;
}

/** Превращает ошибки zod в плоский список понятных сообщений для формы. */
export function formatIssues(error: z.ZodError): string[] {
  const messages = error.issues.map((issue) => issue.message);
  return [...new Set(messages)];
}
