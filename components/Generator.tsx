"use client";

import { useRef, useState } from "react";
import { emptyForm, exampleForm, toBriefInput, type BriefForm as Form } from "@/lib/form";
import { BriefSchema, formatIssues, type Proposal } from "@/lib/schema";
import { BriefForm } from "./BriefForm";
import { ProposalDocument } from "./ProposalDocument";

type Status = "idle" | "loading" | "done";

type ApiResponse = { proposal?: Proposal; error?: string; details?: string[] };

export function Generator({ demo }: { demo: boolean }) {
  const [form, setForm] = useState<Form>(emptyForm);
  const [status, setStatus] = useState<Status>("idle");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const deskRef = useRef<HTMLElement>(null);

  async function generate() {
    const input = toBriefInput(form);
    const check = BriefSchema.safeParse(input);
    if (!check.success) {
      setErrors(formatIssues(check.error));
      return;
    }

    setErrors([]);
    setStatus("loading");
    deskRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(check.data),
      });
      const data = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok || !data.proposal) {
        setErrors([data.error ?? `Сервер ответил ошибкой ${response.status}.`, ...(data.details ?? [])]);
        setStatus(proposal ? "done" : "idle");
        return;
      }
      setProposal(data.proposal);
      setStatus("done");
    } catch {
      setErrors(["Нет связи с сервером. Проверьте интернет и повторите."]);
      setStatus(proposal ? "done" : "idle");
    }
  }

  function downloadPdf() {
    if (!proposal) return;
    // Имя файла в диалоге печати берётся из заголовка страницы.
    const previousTitle = document.title;
    document.title = `КП — ${proposal.meta.clientName}`;
    window.print();
    document.title = previousTitle;
  }

  const showDemoNote = demo || proposal?.source === "demo";

  return (
    <div className="workspace">
      <aside className="workspace-brief">
        <BriefForm
          form={form}
          onChange={setForm}
          onSubmit={generate}
          onFillExample={() => {
            setForm(exampleForm());
            setErrors([]);
          }}
          onReset={() => {
            setForm(emptyForm());
            setErrors([]);
          }}
          busy={status === "loading"}
          errors={errors}
        />
      </aside>

      <section className="desk" ref={deskRef} aria-live="polite" aria-busy={status === "loading"}>
        {proposal && status !== "loading" ? (
          <div className="desk-toolbar">
            <div className="desk-toolbar-text">
              <p>Черновик готов. Проверьте факты и цифры перед отправкой клиенту.</p>
              {showDemoNote ? (
                <p className="demo-note">
                  Демо-режим: КП собрано по шаблону без нейросети. Добавьте ANTHROPIC_API_KEY, чтобы текст писал Claude.
                </p>
              ) : null}
            </div>
            <div className="desk-toolbar-actions">
              <button type="button" className="secondary-button" onClick={generate}>
                Составить заново
              </button>
              <button type="button" className="primary-button" onClick={downloadPdf}>
                Скачать PDF
              </button>
            </div>
          </div>
        ) : null}

        {status === "loading" ? (
          <LoadingSheet />
        ) : proposal ? (
          <ProposalDocument proposal={proposal} />
        ) : (
          <EmptySheet demo={demo} />
        )}

        {proposal && status !== "loading" ? (
          <p className="print-hint">В окне печати выберите «Сохранить как PDF».</p>
        ) : null}
      </section>
    </div>
  );
}

function EmptySheet({ demo }: { demo: boolean }) {
  return (
    <div className="sheet sheet-empty">
      <p className="empty-title">Здесь появится коммерческое предложение</p>
      <p>
        Заполните бриф слева и нажмите «Составить КП». Получится документ из восьми разделов: задача клиента,
        решение, выгоды, этапы, стоимость, гарантии, следующий шаг и подпись.
      </p>
      <p>Нет своего клиента под рукой — нажмите «Заполнить примером».</p>
      {demo ? (
        <p className="demo-note">
          Сейчас включён демо-режим: КП соберётся по шаблону. С ключом Claude API текст напишет нейросеть.
        </p>
      ) : null}
    </div>
  );
}

function LoadingSheet() {
  return (
    <div className="sheet sheet-loading" role="status">
      <p className="loading-label">Составляем предложение. Обычно это занимает 15–30 секунд.</p>
      <div className="skeleton skeleton-title" />
      <div className="skeleton" />
      <div className="skeleton skeleton-short" />
      <div className="skeleton skeleton-gap" />
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton skeleton-short" />
    </div>
  );
}
