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
};

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
