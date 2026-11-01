"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { checkImport, saveImport } from "@/lib/import/actions";
import { groupProblems } from "@/lib/import/report";
import type { ImportReport } from "@/lib/import/types";
import { errorListCsv } from "./error-list";

// The import screens (UI design 6.9, plan step 6.5): choose a file, read the result, confirm, done.
// The server keeps no file. The browser keeps the chosen file and sends it again for the save,
// and the server checks everything again before it saves (FR-17).

type Step =
  | { name: "choose" }
  | { name: "checked"; report: ImportReport }
  | { name: "confirming"; report: ImportReport }
  | { name: "done"; saved: number; skipped: number };

export function ImportPanel({ weddingId }: { weddingId: string }) {
  const [step, setStep] = useState<Step>({ name: "choose" });
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const checkedReport = step.name === "checked" ? step.report : null;

  // The problems open in a dialog box right after the check (UI design 6.9).
  useEffect(() => {
    if (checkedReport && checkedReport.problems.length > 0) dialog.current?.showModal();
  }, [checkedReport]);

  function formData() {
    const data = new FormData();
    if (file) data.set("file", file);
    return data;
  }

  async function check() {
    setBusy(true);
    setMessage(null);
    const result = await checkImport(weddingId, formData());
    setBusy(false);
    if (result.ok) setStep({ name: "checked", report: result.data });
    else {
      setStep({ name: "choose" });
      setMessage(result.error.fields?.file ?? result.error.message);
    }
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    const result = await saveImport(weddingId, formData());
    if (result.ok) {
      setBusy(false);
      setStep({ name: "done", saved: result.data.saved, skipped: result.data.skipped });
      return;
    }
    // Nothing was saved. Show the message and check the file again, so the screen is true.
    setMessage(result.error.message);
    await check();
  }

  function chooseAgain() {
    setFile(null);
    setMessage(null);
    setStep({ name: "choose" });
    if (input.current) input.current.value = "";
  }

  function downloadErrors(report: ImportReport) {
    const blob = new Blob([errorListCsv(groupProblems(report.problems))], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "import-error-list.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (step.name === "done") {
    return (
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <h2 className="text-xl font-semibold">{step.saved} {step.saved === 1 ? "family" : "families"} saved</h2>
        {step.skipped > 0 && <p className="text-muted-foreground">{step.skipped} skipped, because they are already in the app.</p>}
        <Button size="lg" render={<Link href={`/w/${weddingId}/families`} />}>See the families</Button>
      </section>
    );
  }

  if (step.name === "choose") {
    return (
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <h2 className="text-xl font-semibold">Upload your file</h2>
        <input
          ref={input}
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setMessage(null);
          }}
        />
        <Button size="lg" variant="outline" onClick={() => input.current?.click()}>
          {file ? "Choose another file" : "Choose file (.xlsx or .csv)"}
        </Button>
        <p className="text-lg">{file ? file.name : "No file chosen"}</p>
        {message && <p role="alert" className="font-medium text-destructive">{message}</p>}
        <Button size="lg" disabled={!file || busy} onClick={check}>{busy ? "Checking…" : "Check file"}</Button>
      </section>
    );
  }

  const { report } = step;
  const groups = groupProblems(report.problems);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <h2 className="text-xl font-semibold">Result</h2>
      <p className="text-lg">
        {report.totalRows} {report.totalRows === 1 ? "family" : "families"} in the file: {report.newRows} new, {report.skippedRows} already in the app,{" "}
        {report.warningRows} with a warning, {report.errorRows} with an error.
      </p>
      {message && <p role="alert" className="font-medium">{message}</p>}

      {groups.length > 0 && (
        <>
          <Button size="lg" variant="outline" onClick={() => dialog.current?.showModal()}>
            Show errors and warnings
          </Button>
          <dialog
            ref={dialog}
            aria-labelledby="problems-title"
            className="m-auto max-h-[85vh] w-[min(56rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-0 text-foreground backdrop:bg-black/40"
          >
            <div className="flex max-h-[85vh] flex-col gap-4 p-4">
              <h2 id="problems-title" className="text-xl font-semibold">Errors and warnings</h2>
              <p className="text-muted-foreground">
                {report.errorRows} {report.errorRows === 1 ? "row has" : "rows have"} an error. {report.warningRows} with a warning only.
              </p>
              <div className="flex flex-col gap-3 overflow-y-auto">
                {groups.map((group) => (
                  <section key={group.code} className="rounded-lg border border-border">
                    <h3 className="border-b border-border bg-muted px-3 py-2 text-lg font-semibold">
                      {group.kind === "error" ? "Error" : "Warning"}: {group.title} · {group.count} {group.count === 1 ? "row" : "rows"}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="px-3 py-2 font-medium">Row</th>
                            <th className="px-3 py-2 font-medium">Family</th>
                            <th className="px-3 py-2 font-medium">Value</th>
                            <th className="px-3 py-2 font-medium">What to do</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map((item, index) => (
                            <tr key={index} className="border-t border-border align-top">
                              <td className="px-3 py-2">{item.row ?? "Whole file"}</td>
                              <td className="px-3 py-2">{item.familyName}</td>
                              <td className="px-3 py-2">{item.value}</td>
                              <td className="min-w-48 px-3 py-2">{item.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <Button size="lg" variant="outline" onClick={() => downloadErrors(report)}>Download error list</Button>
                <Button size="lg" onClick={() => dialog.current?.close()}>Close</Button>
              </div>
            </div>
          </dialog>
        </>
      )}

      {step.name === "confirming" ? (
        <div className="flex flex-col gap-3">
          <p className="text-lg font-medium">Save {report.newRows} {report.newRows === 1 ? "family" : "families"}?</p>
          <Button size="lg" disabled={busy} onClick={save}>{busy ? "Saving…" : "Yes, save"}</Button>
          <Button size="lg" variant="outline" disabled={busy} onClick={() => setStep({ name: "checked", report })}>Go back</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {report.canSave ? (
            <Button size="lg" onClick={() => setStep({ name: "confirming", report })}>
              Save {report.newRows} {report.newRows === 1 ? "family" : "families"}
            </Button>
          ) : (
            <>
              <Button size="lg" disabled>Save</Button>
              <p className="text-muted-foreground">
                {report.errorRows > 0 ? "Fix the errors in your file, then upload it again. Nothing was saved." : "There is no new family to save."}
              </p>
            </>
          )}
          <Button size="lg" variant="outline" onClick={chooseAgain}>Upload corrected file</Button>
        </div>
      )}
    </section>
  );
}
