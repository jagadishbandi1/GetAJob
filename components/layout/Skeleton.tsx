export default function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-md bg-bg-elevated ${className}`}
      aria-hidden
    />
  );
}

