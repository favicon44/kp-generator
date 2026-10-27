import type { Brief, Currency, Proposal } from "./schema";

/** Срок действия предложения по умолчанию, в днях. */
export const VALIDITY_DAYS = 14;

/**
 * Стоимость считается только кодом и только из брифа.
 * Нейросеть пишет текст, но не придумывает и не пересчитывает цифры.
 */
export function buildPricing(brief: Brief): Proposal["pricing"] {
  const items = brief.pricing.items.map((item) => ({
    name: item.name,
    amount: roundMoney(item.amount),
  }));
  const total = roundMoney(items.reduce((sum, item) => sum + item.amount, 0));
  return { currency: brief.pricing.currency, items, total };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function buildMeta(brief: Brief, now: Date = new Date()): Proposal["meta"] {
  const issued = startOfUtcDay(now);
  const valid = new Date(issued);
  valid.setUTCDate(valid.getUTCDate() + VALIDITY_DAYS);
  return {
    clientName: brief.client.name,
    contact: brief.client.contact,
    sender: brief.sender,
    productName: brief.product.name,
    issuedAt: issued.toISOString(),
    validUntil: valid.toISOString(),
  };
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
