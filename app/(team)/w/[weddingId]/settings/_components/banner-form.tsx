"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { removeBanner, uploadBanner } from "@/lib/weddings/settings-actions";

const WIDTH = 1600;
const HEIGHT = 900; // 16:9, the shape of the banner on the guest page
const LIMIT = 900_000; // the server accepts up to 1,000,000 bytes

// Shrinks the photo in the browser to a wide 1600 x 900 picture (about 300 KB), cropped from the
// middle. Tries WebP first, then JPEG, with lower quality until the file is small enough.
async function shrinkPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no canvas");

  const scale = Math.max(WIDTH / bitmap.width, HEIGHT / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  context.drawImage(bitmap, (WIDTH - width) / 2, (HEIGHT - height) / 2, width, height);

  for (const type of ["image/webp", "image/jpeg"]) {
    for (const quality of [0.82, 0.7, 0.55, 0.4]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
      if (blob && blob.type === type && blob.size <= LIMIT) return blob;
    }
  }
  throw new Error("too big");
}

export function BannerForm({ weddingId, bannerUrl }: { weddingId: string; bannerUrl: string | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ blob: Blob; url: string } | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  // Free the memory of the preview picture when it is replaced or the page closes.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);

  async function choose(file: File | undefined) {
    setMessage(null);
    if (!file) return;
    setBusy(true);
    try {
      const blob = await shrinkPhoto(file);
      setPreview({ blob, url: URL.createObjectURL(blob) });
    } catch {
      setPreview(null);
      setMessage({ text: "We could not use this photo. Try another JPEG, PNG or WebP photo.", error: true });
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!preview) return;
    setBusy(true);
    const formData = new FormData();
    formData.set("banner", new File([preview.blob], "banner", { type: preview.blob.type }));
    const result = await uploadBanner(weddingId, formData);
    setBusy(false);
    if (!result.ok) return setMessage({ text: result.error.message, error: true });
    setPreview(null);
    if (input.current) input.current.value = "";
    setMessage({ text: "Banner saved.", error: false });
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    const result = await removeBanner(weddingId);
    setBusy(false);
    if (!result.ok) return setMessage({ text: result.error.message, error: true });
    setMessage({ text: "Banner removed.", error: false });
    router.refresh();
  }

  const shown = preview?.url ?? bannerUrl;

  return (
    <div className="flex flex-col gap-4">
      {shown ? (
        // A plain <img>: the picture comes from a blob or from our own banner address.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shown} alt="Banner of the guest page" className="aspect-video w-full rounded-2xl bg-muted object-cover" />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          No banner yet
        </div>
      )}
      {preview && <p className="text-muted-foreground">This is how the banner will look. It is cropped from the middle.</p>}

      <div className="flex flex-col gap-2">
        <Label htmlFor="banner">{bannerUrl || preview ? "Choose another photo" : "Choose a photo"}</Label>
        <input
          ref={input}
          id="banner"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(event) => choose(event.target.files?.[0])}
          className="min-h-11 w-full rounded-lg border border-input bg-card p-2 text-base file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-base"
        />
        <p className="text-muted-foreground">JPEG, PNG or WebP. A wide photo works best.</p>
      </div>

      {message && (
        <p role={message.error ? "alert" : "status"} className={message.error ? "text-destructive" : undefined}>
          {message.text}
        </p>
      )}

      {preview && (
        <Button type="button" size="lg" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save banner"}
        </Button>
      )}
      {bannerUrl && !preview && (
        <Button type="button" variant="outline" size="lg" onClick={remove} disabled={busy}>
          Remove banner
        </Button>
      )}
    </div>
  );
}
