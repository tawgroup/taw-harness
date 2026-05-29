#!/usr/bin/env node
// taw harness CLI entry. Modes: TUI (default), headless run, self-verify build, models, help.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
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

// task = positional args (everything after subcommand that isn't a flag or flag-value)
function parseTask(flagNames) {
  const flagVals = new Set();
  for (const f of flagNames) {
    const i = argv.indexOf(f);
    if (i !== -1) flagVals.add(i), flagVals.add(i + 1);
  }
  return argv.slice(1).filter((_, i) => !flagVals.has(i + 1)).join(" ").trim();
}

// shared headless event printer
const headlessEvents = {
  onEvent(ev) {
    if (ev.type === "assistant") process.stdout.write(c.bold("⏺ ") + ev.text.trim() + "\n");
    else if (ev.type === "tool_call") process.stderr.write(c.green("⚒ ") + ev.name + c.dim(" " + String(ev.preview).split("\n")[0].slice(0, 100)) + "\n");
    else if (ev.type === "tool_result") process.stderr.write(c.dim(String(ev.result).split("\n").slice(0, 3).join("\n").slice(0, 240)) + "\n");
    else if (ev.type === "max_steps") process.stderr.write(c.yellow("⚠ đạt giới hạn số bước\n"));
  },
};

const model = getFlag("--model", DEFAULT_MODEL);

const HELP = `taw harness — coding agent chạy bằng OpenCode Go (model rẻ)

Cách dùng:
  taw                          mở TUI tương tác (chat)
  taw run "<yêu cầu>"          chạy 1 tác vụ rồi thoát (headless, tự duyệt)
  taw -p "<yêu cầu>"           alias của run
  taw build "<yêu cầu>" --verify "<lệnh>"
                               vòng tự làm: build → chạy lệnh kiểm chứng →
                               nếu fail thì tự sửa → lặp tới khi PASS (không cần can thiệp)
  taw models                   liệt kê model gói Go
  taw --help

Tuỳ chọn:
  --model <id>                 chọn model (mặc định ${DEFAULT_MODEL})
  --max-steps <n>              giới hạn số bước mỗi vòng
  --cwd <path>                 thư mục làm việc
  --task-file <path>           đọc nội dung tác vụ từ file (giữ cmdline gọn, an toàn)
  --verify "<lệnh>"            (build) lệnh shell xác nhận thành công (exit 0 = đạt)
  --rounds <n>                 (build) số vòng sửa tối đa (mặc định 4)

Env:
  OPENCODE_API_KEY=<key gói Go>   (bắt buộc; hoặc đặt trong .env)
  TAW_REQUEST_TIMEOUT=<ms>        timeout mỗi request model (mặc định 180000)
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
    const taskFile = getFlag("--task-file", "");
    const task = taskFile
      ? fs.readFileSync(taskFile, "utf8").trim()
      : parseTask(["--model", "--max-steps", "--cwd", "--task-file"]);
    if (!task) { process.stderr.write("Thiếu nội dung tác vụ.\n"); process.exit(2); }

    const cwd = getFlag("--cwd", process.cwd());
    const maxSteps = Number(getFlag("--max-steps", 0)) || undefined;
    const agent = createAgent({ model, cwd, maxSteps, approve: async () => true, ...headlessEvents });
    try {
      await agent.send(task);
    } catch (e) {
      process.stderr.write(c.red(`✗ ${e.message}\n`));
      process.exit(1);
    }
    return;
  }

  // self-verify build: build -> verify -> auto-fix loop (no human in the loop)
  if (cmd === "build") {
    const taskFile = getFlag("--task-file", "");
    const task = taskFile
      ? fs.readFileSync(taskFile, "utf8").trim()
      : parseTask(["--model", "--max-steps", "--cwd", "--verify", "--rounds", "--task-file"]);
    const verify = getFlag("--verify", "");
    const rounds = Number(getFlag("--rounds", 4)) || 4;
    const cwd = getFlag("--cwd", process.cwd());
    const maxSteps = Number(getFlag("--max-steps", 0)) || undefined;
    if (!task) { process.stderr.write("Thiếu nội dung tác vụ.\n"); process.exit(2); }
    if (!verify) { process.stderr.write('build cần --verify "<lệnh kiểm chứng>" (exit 0 = đạt).\n'); process.exit(2); }

    const agent = createAgent({ model, cwd, maxSteps, approve: async () => true, ...headlessEvents });

    let prompt =
      task +
      "\n\nLƯU Ý: sau khi bạn làm xong, hệ thống sẽ TỰ CHẠY lệnh kiểm chứng để xác nhận app chạy thật. " +
      "Nếu có skill phù hợp (vd 'fullstack') hãy gọi load_skill để theo playbook (chia file nhỏ, tách dữ liệu test, map '/'→index.html, tự boot+curl).";

    for (let round = 1; round <= rounds; round++) {
      process.stderr.write(c.bold(`\n=== Vòng ${round}/${rounds} ===\n`));
      try {
        await agent.send(prompt);
      } catch (e) {
        process.stderr.write(c.red(`✗ lỗi agent: ${e.message}\n`));
        process.exit(1);
      }

      process.stderr.write(c.dim(`\n▶ Kiểm chứng: ${verify}\n`));
      const v = spawnSync("bash", ["-lc", verify], { cwd, encoding: "utf8", timeout: 120000 });
      const out = ((v.stdout || "") + (v.stderr || "")).trim();

      if (v.status === 0) {
        process.stdout.write(c.green(`\n✓ Kiểm chứng PASS ở vòng ${round}. Hoàn thành.\n`));
        if (out) process.stdout.write(out.slice(-1200) + "\n");
        return;
      }

      process.stderr.write(c.yellow(`✗ Kiểm chứng FAIL (exit ${v.status}). Đưa lỗi lại cho agent sửa.\n`));
      prompt =
        `Lệnh kiểm chứng \`${verify}\` THẤT BẠI (exit code ${v.status}). Output:\n\n` +
        `${out.slice(-4000)}\n\n` +
        "Hãy đọc lỗi, sửa code cho đúng nguyên nhân rồi để hệ thống chạy lại. Sửa là chính, đừng giải thích dài.";
    }

    process.stderr.write(c.red(`\n✗ Vẫn chưa PASS sau ${rounds} vòng. Dừng.\n`));
    process.exit(1);
  }

  // default: TUI
  await runTui({ model });
}

main().catch((e) => {
  process.stderr.write(`✗ ${e.message}\n`);
  process.exit(1);
});
