import { type ReactNode } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "./Button";
import { Skeleton } from "./primitives";
import { Illustration, type IllustrationName } from "./Illustration";
import { cn } from "@/lib/cn";

export function EmptyState({
  illustration = "box",
  title,
  body,
  action,
  className,
}: {
  illustration?: IllustrationName;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto flex max-w-sm flex-col items-center px-4 py-12 text-center", className)}>
      <Illustration name={illustration} className="mb-4 h-28 w-28" />
      <h2 className="text-h2">{title}</h2>
      {body && <p className="mt-2 text-body text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }: { error: Error; onRetry: () => void; className?: string }) {
  return (
    <div className={cn("mx-auto flex max-w-sm flex-col items-center px-4 py-12 text-center", className)} role="alert">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger-soft text-danger">
        <WifiOff className="h-7 w-7" aria-hidden />
      </span>
      <h2 className="text-h2">Something went wrong</h2>
      <p className="mt-2 text-body text-muted">{error.message}</p>
      <Button className="mt-5" variant="secondary" icon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden>
      <Skeleton className="aspect-square rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-5 w-1/4" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card flex items-center gap-3 p-3">
          <Skeleton className="h-16 w-16 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Renders loading → error → empty → content in that order. The empty state
 * only appears once loading has finished with zero results (no flash).
 */
export function AsyncView<T>({
  state,
  skeleton,
  empty,
  isEmpty,
  children,
}: {
  state: { data: T | undefined; loading: boolean; error: Error | null; reload: () => void };
  skeleton: ReactNode;
  empty?: ReactNode;
  isEmpty?: (d: T) => boolean;
  children: (data: T) => ReactNode;
}) {
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (state.loading || state.data === undefined) return <>{skeleton}</>;
  const emptyCheck = isEmpty ?? ((d: T) => Array.isArray(d) && d.length === 0);
  if (empty && emptyCheck(state.data)) return <>{empty}</>;
  return <>{children(state.data)}</>;
}
