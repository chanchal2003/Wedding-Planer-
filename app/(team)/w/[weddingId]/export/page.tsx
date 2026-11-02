import { Suspense } from "react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/access/guards";
import { forPage } from "@/lib/access/respond";
import { DownloadAll } from "./_components/download-all";

export const metadata = { title: "Export | ShaadiDesk" };

// Export the data as CSV files (FR-65). Admins only: anybody else sees "page not found".
export default function ExportPage({ params }: PageProps<"/w/[weddingId]/export">) {
  return (
    <PageShell>
      <h1 className="text-3xl">Export</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <ExportContent params={params} />
      </Suspense>
    </PageShell>
  );
}

const FILES = [
  { file: "families.csv", title: "Families", text: "One row for each family: names, side, phone numbers, events, organizer and when the invitation was sent." },
  { file: "replies.csv", title: "Replies", text: "One row for each family and event: yes, no or no reply, how many people, and who replied." },
  { file: "team.csv", title: "Team", text: "One row for each person: name, email, role, relation and status." },
];

async function ExportContent({ params }: { params: PageProps<"/w/[weddingId]/export">["params"] }) {
  const { weddingId } = await params;
  forPage(await requireAdmin(weddingId));

  return (
    <>
      <p className="text-lg">
        Download your data as CSV files. They open in Excel and Google Sheets. The families file has phone numbers, so keep it safe.
      </p>
      {FILES.map(({ file, title, text }) => (
        <section key={file} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-muted-foreground">{text}</p>
          <Button variant="outline" size="lg" render={<a href={`/w/${weddingId}/export/${file}`} download />}>
            Download {title.toLowerCase()}
          </Button>
        </section>
      ))}
      <DownloadAll weddingId={weddingId} />
    </>
  );
}
