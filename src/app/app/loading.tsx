export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-4 max-w-4xl">
      <div className="h-9 rounded-md bg-[var(--mist-gray)] w-48" />
      <div className="h-32 rounded-xl bg-[var(--mist-gray)]/80" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-24 rounded-lg bg-[var(--mist-gray)]/70" />
        <div className="h-24 rounded-lg bg-[var(--mist-gray)]/70" />
      </div>
    </div>
  );
}
