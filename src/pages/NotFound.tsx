import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/states";

export default function NotFound() {
  return (
    <div className="page">
      <EmptyState illustration="search" title="We couldn't find that page" body="It may have moved, or the listing may have sold." action={<ButtonLink to="/">Go home</ButtonLink>} />
    </div>
  );
}
