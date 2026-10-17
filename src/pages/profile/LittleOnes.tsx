import { useState } from "react";
import { Baby, Plus, Trash2 } from "lucide-react";
import { RequireAuth } from "@/components/auth/SignIn";
import { useAsync } from "@/hooks/useAsync";
import { addChild, getChildren, removeChild } from "@/services/children";
import { AsyncView, EmptyState, RowSkeleton } from "@/components/ui/states";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, Segmented } from "@/components/ui/primitives";
import { Modal, useToast } from "@/components/ui/overlay";
import { ageLabel, NEXT_STAGE } from "@/config/taxonomy";
import { currentAgeGroup, nextAgeGroup } from "@/lib/children";
import { formatChildAge, formatDate } from "@/lib/format";

export default function LittleOnes() {
  return (
    <RequireAuth title="Sign in to add your little one">
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const state = useAsync(getChildren, [], ["children"]);
  const [open, setOpen] = useState(false);
  const toast = useToast();
  return (
    <div className="page max-w-2xl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-h1">My little ones</h1>
          <p className="text-body text-muted">Optional. We use this only to suggest what's coming up next. Only you can see it.</p>
        </div>
      </div>
      <div className="mt-4">
        <AsyncView
          state={state}
          skeleton={<RowSkeleton count={1} />}
          empty={<EmptyState illustration="baby" title="Add your little one" body="Add a birth date or due date and your home feed will show what they'll need next." action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Add a child</Button>} />}
        >
          {(kids) => (
            <>
              <ul className="space-y-3">
                {kids.map((c) => {
                  const next = NEXT_STAGE[nextAgeGroup(c)];
                  return (
                    <li key={c.id} className="card flex items-center gap-3 p-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                        <Baby className="h-6 w-6" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{c.nickname}</span>
                        <span className="block text-caption text-muted">
                          {formatChildAge(c.birthDate, c.dueDate)} · {c.birthDate ? `born ${formatDate(c.birthDate)}` : `due ${formatDate(c.dueDate!)}`}
                        </span>
                        <span className="block text-caption text-muted">
                          {c.birthDate ? `${ageLabel(currentAgeGroup(c))} now. ` : ""}Coming up: {next?.blurb}
                        </span>
                      </span>
                      <IconButton label={`Remove ${c.nickname}`} onClick={async () => { await removeChild(c.id); toast("Removed"); }}>
                        <Trash2 className="h-5 w-5" />
                      </IconButton>
                    </li>
                  );
                })}
              </ul>
              <Button className="mt-4" variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
                Add another child
              </Button>
            </>
          )}
        </AsyncView>
      </div>
      <AddChildModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function AddChildModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [kind, setKind] = useState<"born" | "due">("born");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a child"
      footer={
        <Button
          full
          disabled={!name.trim() || !date}
          onClick={async () => {
            const iso = new Date(`${date}T00:00:00`).toISOString();
            await addChild(kind === "born" ? { nickname: name.trim(), birthDate: iso } : { nickname: name.trim(), dueDate: iso });
            toast(`${name.trim()} added`);
            setName("");
            setDate("");
            onClose();
          }}
        >
          Save
        </Button>
      }
    >
      <div className="space-y-4">
        <Field label="Nickname" htmlFor="nick" hint="A first name or nickname — just for you.">
          <input id="nick" className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Segmented label="Born or expecting" value={kind} onChange={setKind} className="w-full" options={[{ value: "born", label: "Born" }, { value: "due", label: "Expecting" }]} />
        <Field label={kind === "born" ? "Birth date" : "Due date"} htmlFor="cdate">
          <input id="cdate" type="date" className="input" value={date} max={kind === "born" ? today : undefined} min={kind === "due" ? today : undefined} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
