import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Maximize2, Minus, Play, RotateCcw, Sparkles, TerminalSquare, X } from "lucide-react";

const STORAGE_KEY = "steel-terminal-history-v1";

type Line = { kind: "input" | "output" | "error" | "system"; text: string };

const welcome: Line[] = [
  { kind: "system", text: "STEEL TERMINAL // secure local workspace" },
  { kind: "output", text: "Type `help` to see available commands. Your history stays on this device." },
  { kind: "output", text: "Hook online: terminal-ready · audio-safe · zero telemetry" },
];

const commands = ["help", "status", "hook", "clear", "date", "echo", "about", "install", "reset"];

function readHistory(): Line[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Line[]) : welcome;
  } catch {
    return welcome;
  }
}

export function SteelTerminal() {
  const [lines, setLines] = useState<Line[]>(welcome);
  const [command, setCommand] = useState("");
  const [isMax, setIsMax] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLines(readHistory());
    void navigator.serviceWorker?.register("/sw.js").catch(() => undefined);
    const onInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onInstall);
    window.addEventListener("appinstalled", () => setIsInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", onInstall);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines.slice(-80)));
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const promptLabel = useMemo(() => (isInstalled ? "INSTALLED" : "INSTALL APP"), [isInstalled]);

  function print(text: string, kind: Line["kind"] = "output") {
    setLines((current) => [...current, { kind, text }]);
  }

  async function install() {
    if (!deferredPrompt) {
      print("Install is ready from your browser menu (⋮ → Install STEEL Terminal).", "system");
      return;
    }
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  function run(raw: string) {
    const value = raw.trim();
    if (!value) return;
    setLines((current) => [...current, { kind: "input", text: `steel@local:~$ ${value}` }]);
    const [name, ...args] = value.split(/\s+/);
    switch (name.toLowerCase()) {
      case "help":
        print("COMMANDS");
        print("  help      show this guide");
        print("  status    inspect the local runtime");
        print("  hook      run the STEEL creative hook");
        print("  echo      print a message");
        print("  clear     clear the viewport");
        print("  install   install the terminal as an app");
        print("  reset     restore the welcome screen");
        break;
      case "status":
        print("RUNTIME  online");
        print("SHELL    STEEL/1.0 · browser-native");
        print("CACHE    ready · offline shell enabled");
        print("STORAGE  local-only · history encrypted by browser profile");
        break;
      case "hook":
        print("HOOK // turning intent into signal...");
        print("  01  listen      ✓  input channel open");
        print("  02  shape       ✓  command understood");
        print("  03  return      ✓  focus restored");
        print("STEEL says: make something that sounds like you.", "system");
        break;
      case "echo":
        print(args.join(" ") || "(empty)");
        break;
      case "date":
        print(new Date().toString());
        break;
      case "about":
        print("STEEL Terminal is a focused, installable command surface for the 3xTrinity workspace.");
        print("No account. No cloud history. Just a fast local hook.");
        break;
      case "clear":
        setLines([]);
        break;
      case "reset":
        setLines(welcome);
        break;
      case "install":
        void install();
        break;
      default:
        print(`${name}: command not found. Try \`help\`.`, "error");
    }
    setCommand("");
  }

  return (
    <section className={isMax ? "terminal-app terminal-max" : "terminal-app"} onClick={() => inputRef.current?.focus()}>
      <div className="terminal-topbar">
        <div className="terminal-brand"><span className="terminal-mark"><TerminalSquare size={16} /></span><span>STEEL TERMINAL</span><span className="terminal-badge">LOCAL</span></div>
        <div className="terminal-actions">
          <button type="button" title="Run hook" onClick={(e) => { e.stopPropagation(); run("hook"); }}><Play size={15} /></button>
          <button type="button" title="Install app" onClick={(e) => { e.stopPropagation(); void install(); }}><Download size={15} /></button>
          <button type="button" title="Toggle fullscreen" onClick={(e) => { e.stopPropagation(); setIsMax((v) => !v); }}>{isMax ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button>
        </div>
      </div>
      <div className="terminal-windowbar"><span className="window-dot red" /><span className="window-dot amber" /><span className="window-dot green" /><span className="window-title">~/steel/workspace</span><span className="window-status"><span className="pulse-dot" /> READY</span></div>
      <div className="terminal-body" role="log" aria-live="polite">
        {lines.map((line, index) => <div className={`terminal-line line-${line.kind}`} key={`${index}-${line.text}`}><span>{line.text}</span></div>)}
        <div className="terminal-input-row"><span className="terminal-prompt">steel@local:~$</span><input ref={inputRef} value={command} onChange={(e) => setCommand(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(command); if (e.key === "Tab") { e.preventDefault(); const match = commands.find((c) => c.startsWith(command)); if (match) setCommand(match); } }} aria-label="Terminal command" autoComplete="off" spellCheck={false} autoFocus /><span className="caret" /></div>
        <div ref={endRef} />
      </div>
      <div className="terminal-footer"><span><Sparkles size={13} /> {promptLabel}</span><span>⌘ K focus · TAB complete · ENTER run</span><button type="button" onClick={(e) => { e.stopPropagation(); setLines(welcome); }} title="Reset terminal"><RotateCcw size={13} /></button><button type="button" onClick={(e) => { e.stopPropagation(); setLines([]); }} title="Clear terminal"><X size={13} /></button></div>
    </section>
  );
}

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
