// ANSI helpers for the TUI — zero deps.
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const wrap = (open, close) => (s) => (useColor ? `\x1b[${open}m${s}\x1b[${close}m` : String(s));

export const c = {
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  blue: wrap(34, 39),
  magenta: wrap(35, 39),
  cyan: wrap(36, 39),
  gray: wrap(90, 39),
  italic: wrap(3, 23),
  underline: wrap(4, 24),
};

// Minimal zero-dep Markdown → ANSI for the TUI: headings, bold, italic, inline code,
// bullets, fenced code blocks, links. Safe to re-scan (ANSI codes contain no md chars).
function renderInline(s) {
  s = s.replace(/`([^`]+)`/g, (_, t) => c.cyan(t));
  s = s.replace(/\*\*([^*]+)\*\*/g, (_, t) => c.bold(t));
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, (_, a, t) => a + c.italic(t));
  s = s.replace(/(^|[^_\w])_([^_\n]+)_(?![_\w])/g, (_, a, t) => a + c.italic(t));
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => c.underline(c.blue(t)) + c.dim(` (${u})`));
  return s;
}

export function renderMarkdown(text) {
  const out = [];
  let inFence = false;
  for (let line of String(text).split("\n")) {
    if (/^\s*```/.test(line)) { inFence = !inFence; continue; } // drop fence markers
    if (inFence) { out.push(c.dim("  │ ") + c.cyan(line)); continue; }
    const h = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (h) { out.push(c.bold(c.yellow(h[2]))); continue; }
    line = line.replace(/^(\s*)[-*]\s+/, (_, sp) => sp + c.yellow("• "));
    out.push(renderInline(line));
  }
  return out.join("\n");
}

export function banner(model) {
  const line = c.dim("─".repeat(48));
  return (
    "\n" +
    c.bold(c.magenta("  ▟▙ taw harness")) +
    c.dim("  · powered by OpenCode Go (cheap models)") +
    "\n" +
    line +
    "\n" +
    c.dim("  model: ") + c.cyan(model) +
    c.dim("   ·  /help for commands  ·  /exit to quit") +
    "\n" +
    line +
    "\n"
  );
}

// a tiny spinner that runs while an async fn is pending
export async function withSpinner(label, fn) {
  if (!process.stdout.isTTY) return fn();
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  const t = setInterval(() => {
    process.stdout.write("\r" + c.magenta(frames[i++ % frames.length]) + " " + c.dim(label) + "  ");
  }, 80);
  try {
    return await fn();
  } finally {
    clearInterval(t);
    process.stdout.write("\r\x1b[2K"); // clear line
  }
}
