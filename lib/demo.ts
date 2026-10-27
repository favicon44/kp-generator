import type { Brief, Draft } from "./schema";

/**
 * Демо-режим: шаблонное КП без нейросети.
 * Работает, когда не задан ANTHROPIC_API_KEY, — чтобы посетитель увидел результат сразу.
 * Текст собирается из брифа по правилам, поэтому он проще, чем у Claude, но структура та же.
 */
export function buildDemoDraft(brief: Brief): Draft {
  const pains = sentences(brief.task).slice(0, 5).map((s) => clip(s, 220));
  while (pains.length < 2) {
    pains.push(
      pains.length === 0
        ? clip(brief.task, 220)
        : "Решение нужно внедрить без лишней нагрузки на команду клиента.",
    );
  }

  const productSentences = sentences(brief.product.description);
  const summary = clip(productSentences.slice(0, 2).join(" ") || brief.product.description, 700);
  const extraPoints = productSentences.slice(2, 6);
  const points = (extraPoints.length >= 2 ? extraPoints : brief.pricing.items.map((item) => item.name))
    .slice(0, 6)
    .map((s) => clip(s, 220));
  while (points.length < 2) points.push("Сопровождение на всех этапах работ");

  const items = brief.pricing.items;
  const stages =
    items.length >= 2
      ? items.slice(0, 7).map((item, index) => ({
          title: clip(item.name, 90),
          description: "Выполняем работы этапа, показываем промежуточный результат и согласуем его с вами.",
          duration: "по согласованию",
          result: index === items.length - 1 ? "Работа сдана, вы пользуетесь результатом" : "Согласованный промежуточный результат",
        }))
      : [
          {
            title: "Старт и уточнение задачи",
            description: "Созваниваемся, фиксируем цели, ограничения и критерии результата.",
            duration: "по согласованию",
            result: "Согласованное техническое задание",
          },
          {
            title: "Выполнение работ",
            description: `Внедряем «${clip(brief.product.name, 60)}» и держим вас в курсе хода работ.`,
            duration: "по согласованию",
            result: "Готовое решение на проверку",
          },
          {
            title: "Сдача и запуск",
            description: "Передаём результат, проводим инструктаж и отвечаем на вопросы.",
            duration: "по согласованию",
            result: "Решение работает у вас",
          },
        ];

  const guarantees = sentences(brief.terms)
    .filter((s) => /гарант|возврат|бесплатн/i.test(s))
    .slice(0, 4)
    .map((s) => clip(s, 220));

  const contacts = [brief.sender.person, brief.sender.contacts].filter(Boolean).join(", ");

  return {
    title: clip(`${brief.client.name}: ${brief.product.name}`, 140),
    lead: clip(`Предлагаем решение задачи, которую вы обозначили: ${lowerFirst(pains[0] ?? brief.task)}`, 320),
    understanding: clip(`${brief.client.about} Ниже — то, что мешает сейчас и что решает это предложение.`, 1000),
    pains,
    solution: { summary, points },
    benefits: [
      {
        title: "Задача закрывается целиком",
        description: clip(`«${brief.product.name}» отвечает на основную задачу: ${lowerFirst(pains[0] ?? brief.task)}`, 320),
      },
      {
        title: "Понятный порядок работ",
        description: "Работа разбита на этапы с измеримым результатом — вы всегда знаете, что уже сделано и что дальше.",
      },
      {
        title: "Прозрачная стоимость",
        description: "Стоимость разложена по позициям и зафиксирована в предложении — без скрытых платежей.",
      },
    ],
    stages,
    pricingComment: clip(brief.terms, 600),
    guarantees,
    nextStep: {
      action: "Согласовать старт работ",
      details: clip(
        contacts
          ? `Ответьте на это предложение или свяжитесь с нами: ${contacts}. Подтвердим детали и начнём работу.`
          : "Ответьте на это предложение — подтвердим детали и начнём работу.",
        320,
      ),
    },
    closing: "Будем рады обсудить детали и ответить на вопросы.",
  };
}

/** Делит текст на предложения и пункты списка. */
export function sentences(value: string): string[] {
  return value
    .split(/(?<=[.!?…])\s+|\n+|;\s*/)
    .map((s) => s.replace(/^[\s\-–—•*\d.)]+/, "").trim())
    .filter((s) => s.length > 2)
    .map(ensurePeriod);
}

function ensurePeriod(s: string): string {
  return /[.!?…]$/.test(s) ? s : `${s}.`;
}

function lowerFirst(s: string): string {
  // Не трогаем аббревиатуры и названия: «CRM», «Яндекс».
  if (s.length > 1 && s[1] === s[1]?.toUpperCase() && /[A-ZА-ЯЁ]/.test(s[1] ?? "")) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

export function clip(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–—-]+$/, "")}…`;
}
