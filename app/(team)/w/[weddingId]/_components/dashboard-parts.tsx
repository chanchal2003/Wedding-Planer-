import Link from "next/link";
import { EventDot } from "@/components/shared/event-dot";
import { Button } from "@/components/ui/button";
import type { BySide, Counts } from "@/lib/dashboard/stats";
import type { SetupStep } from "@/lib/dashboard/queries";

// The pieces of the home page (UI design 6.6). They are plain server components: no scripts are needed.

export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      {title && <h2 className="text-xl font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

// "Today · Replies close 20 December · Wedding 31 December"
export function Timeline({ today, repliesClose, wedding }: { today: string; repliesClose: string | null; wedding: string }) {
  return (
    <ol aria-label="Timeline" className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
      <li>Today {today}</li>
      {repliesClose && <li>Replies close {repliesClose}</li>}
      <li>Wedding {wedding}</li>
    </ol>
  );
}

// The next step as one big card with one button; the other steps are collapsed (admins only, while setup is not complete).
export function SetupCard({ steps }: { steps: SetupStep[] }) {
  const next = steps.find((step) => !step.done && !step.locked);
  const rest = steps.filter((step) => step !== next);
  const doneCount = steps.filter((step) => step.done).length;
  if (doneCount === steps.length) return null;

  return (
    <Card>
      {next ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Next step</p>
          <h2 className="text-xl font-semibold">{next.label}</h2>
          <Button size="lg" render={<Link href={next.href} />}>{next.button}</Button>
        </div>
      ) : (
        <p className="text-lg">Setup: {doneCount} of {steps.length} steps are done.</p>
      )}
      <details>
        <summary className="min-h-11 cursor-pointer py-2 text-muted-foreground">
          {next ? `${rest.length} more ${rest.length === 1 ? "step" : "steps"}` : "All steps"}
        </summary>
        <ul className="flex flex-col gap-2 pt-1">
          {steps.map((step) => (
            <li key={step.key} className="flex flex-col">
              <span>
                <span aria-hidden="true">{step.done ? "✓" : step.locked ? "–" : "▸"}</span>{" "}
                <span className="sr-only">{step.done ? "Done: " : step.locked ? "Locked: " : "To do: "}</span>
                {step.label}
              </span>
              {step.locked && !step.done && step.note && <span className="pl-5 text-muted-foreground">{step.note}</span>}
            </li>
          ))}
        </ul>
      </details>
    </Card>
  );
}

export function RepliesSummary({ replied, families }: { replied: number; families: number }) {
  const percent = families === 0 ? 0 : Math.round((replied / families) * 100);
  return (
    <Card>
      <p className="text-lg font-medium">Replies: {replied} of {families} {families === 1 ? "family" : "families"} · {percent}%</p>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Families that replied" className="h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </Card>
  );
}

// The three rows of "needs attention" (FR-44). A row with 0 is hidden. Each row opens the matching filter of Families.
export function Attention({ weddingId, noReply, noPhone, notSent }: { weddingId: string; noReply: number; noPhone: number; notSent: number }) {
  const rows = [
    { count: noReply, text: (n: number) => `${n} ${n === 1 ? "family has" : "families have"} not replied`, status: "no-reply" },
    { count: noPhone, text: (n: number) => `${n} ${n === 1 ? "family has" : "families have"} no phone number`, status: "no-number" },
    { count: notSent, text: (n: number) => `${n} ${n === 1 ? "invitation is" : "invitations are"} not sent`, status: "not-sent" },
  ].filter((row) => row.count > 0);

  return (
    <Card title="Needs attention">
      {rows.length === 0 ? (
        <p className="text-lg">Nothing needs attention.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.status}>
              <Link href={`/w/${weddingId}/families?status=${row.status}`} className="flex min-h-11 items-center rounded-lg px-1 text-lg underline-offset-4 hover:underline">
                {row.text(row.count)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Row({ label, counts, strong }: { label: string; counts: Counts; strong?: boolean }) {
  return (
    <tr className={strong ? "font-semibold" : ""}>
      <th scope="row" className="py-2 pr-3 text-left font-normal">{label}</th>
      <td className="px-2 py-2 text-right">{counts.invited}</td>
      <td className="px-2 py-2 text-right">
        {counts.yes}
        {counts.yes > 0 && <span className="block text-sm font-normal text-muted-foreground">{counts.persons} {counts.persons === 1 ? "person" : "people"}</span>}
      </td>
      <td className="px-2 py-2 text-right">{counts.no}</td>
      <td className="py-2 pl-2 text-right">{counts.noReply}</td>
    </tr>
  );
}

// The counts of one event, or of the whole wedding: invited, yes (people), no, no reply, for each side and the total (FR-43).
export function CountsCard({ title, type, counts }: { title: string; type?: string; counts: BySide }) {
  return (
    <Card>
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        {type && <EventDot type={type} />}
        {title}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-72">
          <caption className="sr-only">Guest counts for {title}</caption>
          <thead>
            <tr className="text-sm text-muted-foreground">
              <th scope="col" className="py-1 pr-3 text-left font-medium"><span className="sr-only">Side</span></th>
              <th scope="col" className="px-2 py-1 text-right font-medium">Invited</th>
              <th scope="col" className="px-2 py-1 text-right font-medium">Yes</th>
              <th scope="col" className="px-2 py-1 text-right font-medium">No</th>
              <th scope="col" className="py-1 pl-2 text-right font-medium">No reply</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <Row label="Total" counts={counts.total} strong />
            <Row label="Bride's side" counts={counts.bride} />
            <Row label="Groom's side" counts={counts.groom} />
            <Row label="Both sides" counts={counts.both} />
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function Organizers({ organizers }: { organizers: { id: string | null; name: string; families: number; sent: number; replied: number }[] }) {
  if (organizers.length === 0) return null;
  return (
    <Card title="By organizer">
      <ul className="flex flex-col gap-2">
        {organizers.map((organizer) => (
          <li key={organizer.id ?? "none"} className="text-lg">
            <span className="font-medium">{organizer.name}:</span> {organizer.families} {organizer.families === 1 ? "family" : "families"}, {organizer.sent} sent, {organizer.replied} replied
          </li>
        ))}
      </ul>
    </Card>
  );
}
