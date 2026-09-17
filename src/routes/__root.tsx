import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "STEEL Terminal";
export const Route = createRootRoute({
  head: () => ({ meta: [{ charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" }, { title: APP_NAME }, { name: "description", content: "A local-first command surface with safe hooks for GitHub, GitLab, VS Code, and Copilot." }, { name: "theme-color", content: "#0c0d0b" }], links: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }, { rel: "stylesheet", href: appCss }, { rel: "manifest", href: "/__grok/manifest.webmanifest" }, { rel: "apple-touch-icon", href: "/favicon.svg" }] }),
  component: () => <html lang="en" suppressHydrationWarning><head><HeadContent /></head><body><PreviewHostBridge /><AuthProvider><Outlet /></AuthProvider><Scripts /></body></html>,
});
