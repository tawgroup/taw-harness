#!/usr/bin/env node
// taw harness CLI entry. Modes: TUI (default), headless run, models, help.
import { createAgent } from "../src/agent.mjs";
import { runTui } from "../src/tui.mjs";
import { assertKey, GO_MODELS, DEFAULT_MODEL } from "../src/config.mjs";
import { c } from "../src/ui.mjs";

const argv = process.argv.slice(2);

function getFlag(name, def) {
  const i = argv.indexOf(name);
  if (i === -1) return def;
  return argv[i + 1];
}
const hasFlag = (name) => argv.includes(name);

const model = getFlag("--model", DEFAULT_MODEL);

const HELP = `taw harness — coding agent chạy bằng OpenCode Go (model rẻ)

Cách dùng:
  taw                          mở TUI tương tác (chat)
  taw run "<yêu cầu>"          chạy 1 tác vụ rồi thoát (headless, tự duyệt)
  taw -p "<yêu cầu>"           alias của run
  taw models                   liệt kê model gói Go
  taw --help

Tuỳ chọn:
  --model <id>                 chọn model (mặc định ${DEFAULT_MODEL})
  --max-steps <n>              giới hạn số bước
  --cwd <path>                 thư mục làm việc

Env:
  OPENCODE_API_KEY=<key gói Go>   (bắt buộc; hoặc đặt trong .env)
`;

async function main() {
  const cmd = argv[0];

  if (hasFlag("--help") || hasFlag("-h") || cmd === "help") {
    process.stdout.write(HELP);
    return;
  }
  if (cmd === "models") {
    process.stdout.write(GO_MODELS.join("\n") + "\n");
    return;
  }

  assertKey();

  // headless run
  if (cmd === "run" || cmd === "-p") {
    // task = everything after the subcommand that isn't a flag/flag-value
    const flagVals = new Set();
    for (const f of ["--model", "--max-steps", "--cwd"]) {
      const i = argv.indexOf(f);
      if (i !== -1) flagVals.add(i), flagVals.add(i + 1);
    }
    const task = argv.slice(1).filter((_, i) => !flagVals.has(i + 1)).join(" ").trim();
    if (!task) { process.stderr.write("Thiếu nội dung tác vụ.\n"); process.exit(2); }

    const cwd = getFlag("--cwd", process.cwd());
    const maxSteps = Number(getFlag("--max-steps", 0)) || undefined;
    const agent = createAgent({
      model, cwd, maxSteps,
      approve: async () => true, // headless: auto-approve
      onEvent(ev) {
        if (ev.type === "assistant") process.stdout.write(c.bold("⏺ ") + ev.text.trim() + "\n");
        else if (ev.type === "tool_call") process.stderr.write(c.green("⚒ ") + ev.name + c.dim(" " + String(ev.preview).split("\n")[0].slice(0, 100)) + "\n");
        else if (ev.type === "tool_result") process.stderr.write(c.dim(String(ev.result).split("\n").slice(0, 3).join("\n").slice(0, 240)) + "\n");
        else if (ev.type === "max_steps") process.stderr.write(c.yellow("⚠ đạt giới hạn số bước\n"));
      },
    });
    try {
      await agent.send(task);
    } catch (e) {
      process.stderr.write(c.red(`✗ ${e.message}\n`));
      process.exit(1);
    }
    return;
  }

  // default: TUI
  await runTui({ model });
}

main().catch((e) => {
  process.stderr.write(`✗ ${e.message}\n`);
  process.exit(1);
});
