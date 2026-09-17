import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { SteelTerminal } from "@/components/steel-terminal";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <AppShell>
      <SteelTerminal />
    </AppShell>
  );
}
