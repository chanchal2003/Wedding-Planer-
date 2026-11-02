"use client";

import { Button } from "@/components/ui/button";

// Starts the three downloads one after the other (AC-65.1). A browser may ask once to allow several downloads.
export function DownloadAll({ weddingId }: { weddingId: string }) {
  function start() {
    ["families.csv", "replies.csv", "team.csv"].forEach((file, index) => {
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = `/w/${weddingId}/export/${file}`;
        link.download = "";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }, index * 700);
    });
  }
  return (
    <Button size="lg" onClick={start}>
      Download all three
    </Button>
  );
}
