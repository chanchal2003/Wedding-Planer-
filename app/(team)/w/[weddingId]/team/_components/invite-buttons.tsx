"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// The two buttons of a pending person (FR-9): open WhatsApp with the message ready, or copy it.
// They stay on the card, so they also serve as "Send again". The app never sends the message.
export function InviteButtons({ message, whatsappUrl }: { message: string; whatsappUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button size="lg" className="flex-1" render={<a href={whatsappUrl} target="_blank" rel="noopener noreferrer" />}>
        Invite on WhatsApp
      </Button>
      <Button type="button" variant="outline" size="lg" className="flex-1" onClick={copy}>
        {copied ? "Copied" : "Copy invite message"}
      </Button>
    </div>
  );
}
