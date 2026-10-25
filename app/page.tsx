import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Sample page for step 1.2. It shows the base style: large text, strong
// contrast, tap targets of at least 44 px. The RSVP page replaces it later.
export default function Home() {
  return (
    <PageShell>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">ShaadiDesk</h1>
        <p className="text-lg text-muted-foreground">
          Events, guests, replies and expenses for your wedding, in one place.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Find your family</CardTitle>
          <CardDescription>Type at least 3 letters of your family name.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="family">Family name</Label>
            <Input id="family" placeholder="For example: Sharma" autoComplete="off" />
          </div>
          <Button size="lg">Find my family</Button>
          <Button variant="outline" size="lg">
            Request access
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
