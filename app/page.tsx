import { Generator } from "@/components/Generator";

// Наличие ключа проверяем при каждом запросе, а не при сборке.
export const dynamic = "force-dynamic";

export default function Home() {
  const demo = !process.env.ANTHROPIC_API_KEY;

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <p className="brand">Генератор КП</p>
          <p className="topbar-note">Бриф на входе, готовое коммерческое предложение на выходе</p>
        </div>
      </header>
      <main>
        <Generator demo={demo} />
      </main>
    </>
  );
}
