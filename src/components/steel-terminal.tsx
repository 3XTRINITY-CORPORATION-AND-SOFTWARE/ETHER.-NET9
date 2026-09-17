import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, ExternalLink, Github, Maximize2, Minimize2, Play, RotateCcw, Sparkles, TerminalSquare, X } from "lucide-react";

const STORAGE_KEY = "steel-terminal-history-v2";
type Connector = "github" | "gitlab" | "vscode" | "copilot";
type Line = { kind: "input" | "output" | "error" | "system"; text: string };

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const welcome: Line[] = [
  { kind: "system", text: "STEEL TERMINAL // local-first world engine" },
  { kind: "output", text: "Hook mirror online · GitHub · GitLab · VS Code · Copilot" },
  { kind: "output", text: "Type `help` to inspect the bridge. No credentials are requested or stored here." },
];
const commands = ["help", "status", "hook", "connect", "github", "gitlab", "vscode", "copilot", "open", "clear", "date", "echo", "about", "install", "reset"];
const connectorMeta: Record<Connector, { label: string; detail: string; href: string; icon: typeof Github }> = {
  github: { label: "GitHub", detail: "Repositories, issues, pull requests", href: "https://github.com/", icon: Github },
  gitlab: { label: "GitLab", detail: "Projects, merge requests, pipelines", href: "https://gitlab.com/", icon: Github },
  vscode: { label: "Visual Studio Code", detail: "Open this workspace in your editor", href: "vscode://file/", icon: TerminalSquare },
  copilot: { label: "Copilot", detail: "Draft, explain, and review with your assistant", href: "https://github.com/features/copilot", icon: Sparkles },
};

function readHistory(): Line[] {
  try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) as Line[] : welcome; } catch { return welcome; }
}

export function SteelTerminal() {
  const [lines, setLines] = useState<Line[]>(welcome);
  const [command, setCommand] = useState("");
  const [isMax, setIsMax] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [connected, setConnected] = useState<Record<Connector, boolean>>({ github: false, gitlab: false, vscode: false, copilot: false });
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLines(readHistory());
    void navigator.serviceWorker?.register("/sw.js").catch(() => undefined);
    const onInstall = (event: Event) => { event.preventDefault(); setDeferredPrompt(event as BeforeInstallPromptEvent); };
    const onInstalled = () => setIsInstalled(true);
    window.addEventListener("beforeinstallprompt", onInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onInstall); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(lines.slice(-100))); endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines]);

  const connectedCount = useMemo(() => Object.values(connected).filter(Boolean).length, [connected]);
  function print(text: string, kind: Line["kind"] = "output") { setLines((current) => [...current, { kind, text }]); }
  async function install() {
    if (!deferredPrompt) { print("Install is available from your browser menu (⋮ → Install STEEL Terminal).", "system"); return; }
    await deferredPrompt.prompt(); await deferredPrompt.userChoice; setDeferredPrompt(null);
  }
  function connect(target: Connector) {
    setConnected((current) => ({ ...current, [target]: true }));
    print(`${connectorMeta[target].label.toUpperCase()} HOOK  linked locally · deep-link ready`, "system");
    print("Security: STEEL never asks for or stores your token in this browser.");
  }
  function run(raw: string) {
    const value = raw.trim(); if (!value) return;
    setLines((current) => [...current, { kind: "input", text: `steel@local:~$ ${value}` }]);
    const [name, ...args] = value.split(/\s+/); const target = name.toLowerCase() as Connector;
    switch (name.toLowerCase()) {
      case "help": print("COMMANDS"); print("  status             inspect runtime and hooks"); print("  hook               run the creative hook mirror"); print("  connect <service>  link github, gitlab, vscode, or copilot"); print("  open <service>     open the safe service landing page"); print("  clear / reset      manage the local viewport"); print("  install            install this terminal as an app"); break;
      case "status": print(`RUNTIME  online · ${connectedCount}/4 hooks linked`); print("SHELL    STEEL/1.0 · browser-native"); print("CACHE    ready · offline shell enabled"); print("AUTH     local-only · external sign-in stays on its service"); break;
      case "hook": print("HOOK // mirroring intent across the creative toolchain..."); print("  01  listen      ✓  terminal channel open"); print("  02  mirror      ✓  service adapters ready"); print("  03  return      ✓  focus restored"); print("STEEL says: one command, four doors, your work stays yours.", "system"); break;
      case "connect": if (args[0] && args[0].toLowerCase() in connectorMeta) connect(args[0].toLowerCase() as Connector); else print("Usage: connect github|gitlab|vscode|copilot", "error"); break;
      case "open": if (args[0] && args[0].toLowerCase() in connectorMeta) window.open(connectorMeta[args[0].toLowerCase() as Connector].href, "_blank", "noopener,noreferrer"); else print("Usage: open github|gitlab|vscode|copilot", "error"); break;
      case "github": case "gitlab": case "vscode": case "copilot": connect(target); break;
      case "echo": print(args.join(" ") || "(empty)"); break;
      case "date": print(new Date().toString()); break;
      case "about": print("STEEL Terminal is a focused command surface with safe, browser-native service hooks."); print("It mirrors intent; it does not impersonate GitHub, GitLab, VS Code, or Copilot."); break;
      case "clear": setLines([]); break;
      case "reset": setLines(welcome); break;
      case "install": void install(); break;
      default: print(`${name}: command not found. Try \`help\`.`, "error");
    }
    setCommand("");
  }
  return <section className={isMax ? "terminal-app terminal-max" : "terminal-app"} onClick={() => inputRef.current?.focus()}>
    <div className="terminal-topbar"><div className="terminal-brand"><span className="terminal-mark"><TerminalSquare size={16} /></span><span>STEEL TERMINAL</span><span className="terminal-badge">HOOK MIRROR</span></div><div className="terminal-actions"><button type="button" title="Run hook" onClick={(e) => { e.stopPropagation(); run("hook"); }}><Play size={15} /></button><button type="button" title="Install app" onClick={(e) => { e.stopPropagation(); void install(); }}><Download size={15} /></button><button type="button" title="Toggle fullscreen" onClick={(e) => { e.stopPropagation(); setIsMax((v) => !v); }}>{isMax ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button></div></div>
    <div className="terminal-windowbar"><span className="window-dot red" /><span className="window-dot amber" /><span className="window-dot green" /><span className="window-title">~/steel/world-engine</span><span className="window-status"><span className="pulse-dot" /> {connectedCount} HOOKS</span></div>
    <div className="hook-strip">{(Object.keys(connectorMeta) as Connector[]).map((key) => { const item = connectorMeta[key]; const Icon = item.icon; return <button type="button" key={key} className={connected[key] ? "hook-chip linked" : "hook-chip"} onClick={(e) => { e.stopPropagation(); connect(key); }}><Icon size={13} /> <span>{item.label}</span>{connected[key] ? <Check size={12} /> : null}</button>; })}</div>
    <div className="terminal-body" role="log" aria-live="polite">{lines.map((line, index) => <div className={`terminal-line line-${line.kind}`} key={`${index}-${line.text}`}><span>{line.text}</span></div>)}<div className="terminal-input-row"><span className="terminal-prompt">steel@local:~$</span><input ref={inputRef} value={command} onChange={(e) => setCommand(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(command); if (e.key === "Tab") { e.preventDefault(); const match = commands.find((c) => c.startsWith(command)); if (match) setCommand(match); } }} aria-label="Terminal command" autoComplete="off" spellCheck={false} autoFocus /><span className="caret" /></div><div ref={endRef} /></div>
    <div className="terminal-footer"><span><Sparkles size={13} /> {isInstalled ? "INSTALLED" : "INSTALL APP"}</span><span>⌘ K focus · TAB complete · ENTER run</span><button type="button" onClick={(e) => { e.stopPropagation(); setLines(welcome); }} title="Reset terminal"><RotateCcw size={13} /></button><button type="button" onClick={(e) => { e.stopPropagation(); setLines([]); }} title="Clear terminal"><X size={13} /></button></div>
  </section>;
}
