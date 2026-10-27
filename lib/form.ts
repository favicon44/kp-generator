import type { BriefInput, Currency, Tone } from "./schema";

/** Состояние формы: суммы храним строками, чтобы не мешать вводу «12 500,50». */
export type PriceRow = { id: string; name: string; amount: string };

export type BriefForm = {
  clientName: string;
  clientAbout: string;
  clientContact: string;
  task: string;
  productName: string;
  productDescription: string;
  terms: string;
  currency: Currency;
  priceRows: PriceRow[];
  senderCompany: string;
  senderPerson: string;
  senderContacts: string;
  tone: Tone;
};

let rowCounter = 0;
export function newRow(name = "", amount = ""): PriceRow {
  rowCounter += 1;
  return { id: `row-${rowCounter}`, name, amount };
}

export function emptyForm(): BriefForm {
  return {
    clientName: "",
    clientAbout: "",
    clientContact: "",
    task: "",
    productName: "",
    productDescription: "",
    terms: "",
    currency: "RUB",
    priceRows: [newRow()],
    senderCompany: "",
    senderPerson: "",
    senderContacts: "",
    tone: "friendly",
  };
}

/** «12 500,50 ₽» → 12500.5; пустая строка или мусор → NaN (его поймает валидация). */
export function parseAmount(value: string): number {
  const normalized = value.replace(/[\s ₽$€]/g, "").replace(",", ".");
  if (!normalized) return Number.NaN;
  return /^\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : Number.NaN;
}

export function toBriefInput(form: BriefForm): BriefInput {
  return {
    client: { name: form.clientName, about: form.clientAbout, contact: form.clientContact },
    task: form.task,
    product: { name: form.productName, description: form.productDescription },
    terms: form.terms,
    pricing: {
      currency: form.currency,
      items: form.priceRows
        .filter((row) => row.name.trim() || row.amount.trim())
        .map((row) => ({ name: row.name, amount: parseAmount(row.amount) })),
    },
    sender: { company: form.senderCompany, person: form.senderPerson, contacts: form.senderContacts },
    tone: form.tone,
  };
}

/** Пример брифа для кнопки «Заполнить примером» и для демо. */
export function exampleForm(): BriefForm {
  return {
    clientName: "Студия ремонта «Чистовая»",
    clientAbout:
      "Ремонт ванных комнат и санузлов под ключ в Твери и области. Команда из 12 мастеров, около 30 объектов в месяц. Заявки приходят в основном с Авито.",
    clientContact: "Андрею Соколову, владельцу студии",
    task:
      "Менеджер не успевает отвечать на сообщения в Авито, особенно вечером и в выходные. Клиенты уходят к конкурентам, которые ответили первыми. На расчёт предварительной сметы уходит до двух дней. Половина обращений — однотипные вопросы о цене и сроках.",
    productName: "ИИ-ассистент для Авито",
    productDescription:
      "Ассистент отвечает клиентам в чате Авито круглосуточно. Задаёт уточняющие вопросы: площадь, тип работ, материалы, сроки. По ответам считает предварительную смету по прайсу студии. Горячие заявки сразу передаёт менеджеру в Telegram с кратким резюме диалога. Все диалоги сохраняются в таблицу для анализа.",
    terms:
      "Запуск за 3 недели. Оплата: 50% предоплата, 50% после запуска. Гарантия: бесплатные доработки в течение 30 дней после запуска. Расходы на API нейросети оплачиваются отдельно, около 3 000 ₽ в месяц.",
    currency: "RUB",
    priceRows: [
      newRow("Аудит воронки продаж и сценариев диалогов", "25000"),
      newRow("Настройка и обучение ассистента на прайсе студии", "90000"),
      newRow("Сопровождение в первый месяц работы", "15000"),
    ],
    senderCompany: "Агентство ИИ-решений «Точка роста»",
    senderPerson: "Ирина Белова, руководитель проектов",
    senderContacts: "+7 900 000-00-00, hello@example.ru",
    tone: "friendly",
  };
}
