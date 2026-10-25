export default function Spinner({ label = 'Loading...' }) {
  return <div className="flex min-h-40 items-center justify-center gap-3 text-muted"><span className="spinner" aria-hidden="true" />{label}</div>;
}
