import { formatDate, formatMoney } from "@/lib/pricing";
import type { Proposal } from "@/lib/schema";

/** Лист КП формата A4. Одна и та же разметка используется для превью и для PDF. */
export function ProposalDocument({ proposal }: { proposal: Proposal }) {
  const { meta, pricing } = proposal;
  const signature = [meta.sender.person, meta.sender.company, meta.sender.contacts].filter(Boolean);

  return (
    <article className="sheet" aria-label="Коммерческое предложение">
      <header className="sheet-head">
        <p className="sheet-from">{meta.sender.company}</p>
        <dl className="sheet-dates">
          <div>
            <dt>Дата</dt>
            <dd>{formatDate(meta.issuedAt)}</dd>
          </div>
          <div>
            <dt>Действует до</dt>
            <dd>{formatDate(meta.validUntil)}</dd>
          </div>
        </dl>
      </header>

      <p className="sheet-to">
        <span>{meta.clientName}</span>
        {meta.contact ? <span>{meta.contact}</span> : null}
      </p>

      <h1 className="doc-title">{proposal.title}</h1>
      <p className="doc-lead">{proposal.lead}</p>

      <section className="doc-section">
        <h2>Ваша задача</h2>
        <p>{proposal.understanding}</p>
        <ul className="doc-list">
          {proposal.pains.map((pain) => (
            <li key={pain}>{pain}</li>
          ))}
        </ul>
      </section>

      <section className="doc-section">
        <h2>Что предлагаем</h2>
        <p>{proposal.solution.summary}</p>
        <ul className="doc-list">
          {proposal.solution.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      <section className="doc-section">
        <h2>Что вы получите</h2>
        <div className="benefits">
          {proposal.benefits.map((benefit) => (
            <div className="benefit" key={benefit.title}>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="doc-section">
        <h2>Как будем работать</h2>
        <ol className="stages">
          {proposal.stages.map((stage, index) => (
            <li className="stage" key={`${index}-${stage.title}`}>
              <span className="stage-number" aria-hidden="true">
                {index + 1}
              </span>
              <div className="stage-body">
                <div className="stage-head">
                  <h3>{stage.title}</h3>
                  <span className="stage-duration">{stage.duration}</span>
                </div>
                <p>{stage.description}</p>
                <p className="stage-result">Результат: {stage.result}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="doc-section">
        <h2>Стоимость</h2>
        <table className="price-table">
          <thead>
            <tr>
              <th scope="col">Позиция</th>
              <th scope="col">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {pricing.items.map((item, index) => (
              <tr key={`${index}-${item.name}`}>
                <td>{item.name}</td>
                <td>{formatMoney(item.amount, pricing.currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Итого</th>
              <td>{formatMoney(pricing.total, pricing.currency)}</td>
            </tr>
          </tfoot>
        </table>
        <p className="price-comment">{proposal.pricingComment}</p>
      </section>

      {proposal.guarantees.length > 0 ? (
        <section className="doc-section">
          <h2>Гарантии</h2>
          <ul className="doc-list">
            {proposal.guarantees.map((guarantee) => (
              <li key={guarantee}>{guarantee}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="doc-section next-step">
        <h2>Следующий шаг</h2>
        <p className="next-action">{proposal.nextStep.action}</p>
        <p>{proposal.nextStep.details}</p>
      </section>

      <footer className="sheet-sign">
        <p>{proposal.closing}</p>
        <p className="sign-block">
          <span>С уважением,</span>
          {signature.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
      </footer>
    </article>
  );
}
