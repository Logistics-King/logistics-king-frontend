export default function VendorPage() {
  return <RoleHome title="화주 홈" description="프로필, 배송 품목, 계약 요청을 관리합니다." />;
}

function RoleHome({ title, description }: { title: string; description: string }) {
  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10">
      <section className="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-emerald-700">택배왕</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">{title}</h1>
        <p className="mt-3 text-slate-600">{description}</p>
      </section>
    </main>
  );
}
