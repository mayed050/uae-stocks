export default function Loading() {
  return (
    <div className="view-fade grid gap-4">
      <div className="fusion-panel overflow-hidden rounded-lg p-5">
        <div className="h-4 w-36 animate-pulse rounded-full bg-sky-500/25" />
        <div className="mt-6 h-12 w-2/3 max-w-xl animate-pulse rounded-lg bg-white/10" />
        <div className="mt-4 h-4 w-full max-w-3xl animate-pulse rounded-full bg-white/10" />
        <div className="mt-3 h-4 w-2/3 max-w-2xl animate-pulse rounded-full bg-white/10" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="fusion-panel h-32 animate-pulse rounded-lg bg-white/5" />
        ))}
      </div>

      <div className="fusion-panel h-96 animate-pulse rounded-lg bg-white/5" />
    </div>
  );
}
