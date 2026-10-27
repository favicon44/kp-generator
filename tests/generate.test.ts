import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GenerationError } from "../lib/errors";
import { exampleForm, toBriefInput } from "../lib/form";
import { generateProposal } from "../lib/generate";
import { validDraft } from "./helpers";

const input = toBriefInput(exampleForm());
const now = new Date("2026-10-27T09:30:00Z");

describe("generateProposal", () => {
  it("без ключа работает демо-режим", async () => {
    const proposal = await generateProposal(input, { now });
    assert.equal(proposal.source, "demo");
    assert.equal(proposal.meta.clientName, "Студия ремонта «Чистовая»");
  });

  it("стоимость считается из брифа, а не из ответа модели", async () => {
    const proposal = await generateProposal(input, { writer: async () => validDraft(), now });
    assert.equal(proposal.source, "ai");
    assert.equal(proposal.pricing.total, 130_000);
    assert.deepEqual(
      proposal.pricing.items.map((item) => item.amount),
      [25_000, 90_000, 15_000],
    );
  });

  it("ставит дату составления и срок действия 14 дней", async () => {
    const proposal = await generateProposal(input, { now });
    assert.equal(proposal.meta.issuedAt, "2026-10-27T00:00:00.000Z");
    assert.equal(proposal.meta.validUntil, "2026-11-10T00:00:00.000Z");
  });

  it("переспрашивает модель, если первый ответ не прошёл проверку", async () => {
    let calls = 0;
    const writer = async () => {
      calls += 1;
      return calls === 1 ? { title: "Только заголовок" } : validDraft();
    };
    const proposal = await generateProposal(input, { writer, now });
    assert.equal(calls, 2);
    assert.equal(proposal.source, "ai");
  });

  it("сдаётся после двух неудачных ответов", async () => {
    let calls = 0;
    const writer = async () => {
      calls += 1;
      return { nope: true };
    };
    await assert.rejects(generateProposal(input, { writer, now }), (error: unknown) => {
      assert.ok(error instanceof GenerationError);
      assert.equal(error.code, "bad_output");
      assert.equal(error.status, 502);
      return true;
    });
    assert.equal(calls, 2);
  });

  it("не вызывает модель при неверном брифе и возвращает понятные ошибки", async () => {
    let called = false;
    const writer = async () => {
      called = true;
      return validDraft();
    };
    const broken = { ...input, task: "   ", pricing: { currency: "RUB", items: [] } };
    await assert.rejects(generateProposal(broken, { writer }), (error: unknown) => {
      assert.ok(error instanceof GenerationError);
      assert.equal(error.code, "invalid_input");
      assert.ok(error.details.includes("Заполните поле «Задача и боль клиента»"));
      assert.ok(error.details.includes("Добавьте хотя бы одну позицию стоимости"));
      return true;
    });
    assert.equal(called, false);
  });

  it("пробрасывает ошибки API без изменений", async () => {
    const writer = async () => {
      throw new GenerationError("rate_limited", "лимит", 429);
    };
    await assert.rejects(generateProposal(input, { writer }), { code: "rate_limited" });
  });
});
