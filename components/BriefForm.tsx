"use client";

import type { FormEvent, ReactNode } from "react";
import { newRow, parseAmount, type BriefForm as Form, type PriceRow } from "@/lib/form";
import { formatMoney } from "@/lib/pricing";
import { CURRENCIES, TONES, TONE_LABELS, type Currency, type Tone } from "@/lib/schema";

type Props = {
  form: Form;
  onChange: (form: Form) => void;
  onSubmit: () => void;
  onFillExample: () => void;
  onReset: () => void;
  busy: boolean;
  errors: string[];
};

const MAX_ROWS = 12;

const CURRENCY_LABELS: Record<Currency, string> = { RUB: "₽ рубли", USD: "$ доллары", EUR: "€ евро" };

export function BriefForm({ form, onChange, onSubmit, onFillExample, onReset, busy, errors }: Props) {
  const set = <K extends keyof Form>(key: K, value: Form[K]) => onChange({ ...form, [key]: value });

  const setRow = (id: string, patch: Partial<PriceRow>) =>
    set(
      "priceRows",
      form.priceRows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );

  const total = form.priceRows.reduce((sum, row) => {
    const amount = parseAmount(row.amount);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="brief" onSubmit={handleSubmit} noValidate>
      <div className="brief-intro">
        <h2>Бриф</h2>
        <p>Опишите клиента и предложение своими словами. Чем конкретнее боль клиента, тем сильнее получится КП.</p>
        <div className="brief-intro-actions">
          <button type="button" className="link-button" onClick={onFillExample} disabled={busy}>
            Заполнить примером
          </button>
          <button type="button" className="link-button" onClick={onReset} disabled={busy}>
            Очистить
          </button>
        </div>
      </div>

      <Fieldset legend="Клиент">
        <Field label="Компания клиента">
          <input
            value={form.clientName}
            onChange={(e) => set("clientName", e.target.value)}
            placeholder="ООО «Ромашка»"
            maxLength={120}
            required
          />
        </Field>
        <Field label="Кто клиент" hint="Сфера, размер, как сейчас устроена работа">
          <textarea
            value={form.clientAbout}
            onChange={(e) => set("clientAbout", e.target.value)}
            rows={3}
            maxLength={1200}
            required
          />
        </Field>
        <Field label="Кому адресовано" hint="Необязательно. Например: Ивану Петрову, директору">
          <input value={form.clientContact} onChange={(e) => set("clientContact", e.target.value)} maxLength={120} />
        </Field>
      </Fieldset>

      <Fieldset legend="Задача">
        <Field label="Задача и боль клиента" hint="Что не работает, что это стоит клиенту, чего он хочет добиться">
          <textarea value={form.task} onChange={(e) => set("task", e.target.value)} rows={5} maxLength={2000} required />
        </Field>
      </Fieldset>

      <Fieldset legend="Продукт">
        <Field label="Название продукта или услуги">
          <input
            value={form.productName}
            onChange={(e) => set("productName", e.target.value)}
            maxLength={120}
            required
          />
        </Field>
        <Field label="Что входит и как работает">
          <textarea
            value={form.productDescription}
            onChange={(e) => set("productDescription", e.target.value)}
            rows={5}
            maxLength={2000}
            required
          />
        </Field>
      </Fieldset>

      <Fieldset legend="Стоимость и условия">
        <div className="price-rows">
          {form.priceRows.map((row, index) => (
            <div className="price-row" key={row.id}>
              <input
                aria-label={`Позиция ${index + 1}`}
                placeholder="Позиция"
                value={row.name}
                onChange={(e) => setRow(row.id, { name: e.target.value })}
                maxLength={120}
              />
              <input
                aria-label={`Сумма позиции ${index + 1}`}
                placeholder="Сумма"
                inputMode="decimal"
                value={row.amount}
                onChange={(e) => setRow(row.id, { amount: e.target.value })}
                className="price-amount"
              />
              <button
                type="button"
                className="icon-button"
                aria-label={`Удалить позицию ${index + 1}`}
                onClick={() =>
                  set(
                    "priceRows",
                    form.priceRows.length > 1 ? form.priceRows.filter((r) => r.id !== row.id) : [newRow()],
                  )
                }
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="price-footer">
          <button
            type="button"
            className="link-button"
            onClick={() => set("priceRows", [...form.priceRows, newRow()])}
            disabled={form.priceRows.length >= MAX_ROWS}
          >
            Добавить позицию
          </button>
          <label className="currency">
            <span className="visually-hidden">Валюта</span>
            <select value={form.currency} onChange={(e) => set("currency", e.target.value as Currency)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="price-total">
          Итого: <strong>{formatMoney(total, form.currency)}</strong>
        </p>
        <Field label="Условия" hint="Сроки, порядок оплаты, гарантии, что не входит в стоимость">
          <textarea value={form.terms} onChange={(e) => set("terms", e.target.value)} rows={4} maxLength={1500} required />
        </Field>
      </Fieldset>

      <Fieldset legend="От кого">
        <Field label="Ваша компания">
          <input
            value={form.senderCompany}
            onChange={(e) => set("senderCompany", e.target.value)}
            maxLength={120}
            required
          />
        </Field>
        <div className="field-pair">
          <Field label="Имя и должность" hint="Необязательно">
            <input value={form.senderPerson} onChange={(e) => set("senderPerson", e.target.value)} maxLength={120} />
          </Field>
          <Field label="Контакты" hint="Необязательно">
            <input value={form.senderContacts} onChange={(e) => set("senderContacts", e.target.value)} maxLength={200} />
          </Field>
        </div>
      </Fieldset>

      <fieldset className="brief-group">
        <legend>Тон</legend>
        <div className="tone-options">
          {TONES.map((tone) => (
            <label key={tone} className="tone-option">
              <input
                type="radio"
                name="tone"
                value={tone}
                checked={form.tone === tone}
                onChange={() => set("tone", tone as Tone)}
              />
              <span>{TONE_LABELS[tone]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {errors.length > 0 ? (
        <div className="form-errors" role="alert">
          <p>Не получилось составить КП:</p>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <button type="submit" className="primary-button" disabled={busy}>
        {busy ? "Составляем КП…" : "Составить КП"}
      </button>
    </form>
  );
}

function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="brief-group">
      <legend>{legend}</legend>
      {children}
    </fieldset>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}
