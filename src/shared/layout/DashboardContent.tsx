export function DashboardContent({
  cards,
}: {
  cards: Array<{ label: string; value: string; description: string }>;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={card.label}>
          <p className="text-sm font-semibold text-slate-500">{card.label}</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{card.value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
        </article>
      ))}
    </section>
  );
}

export function PlaceholderContent({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8">
      <p className="text-sm font-semibold text-emerald-700">준비 중</p>
      <h2 className="mt-3 text-2xl font-bold text-slate-950">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
    </section>
  );
}
