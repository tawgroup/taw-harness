// Tool registry — the model's hands. Each tool: {schema, run(args, ctx)}.
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { TOOL_OUTPUT_CAP } from "./config.mjs";

const cap = (s) =>
  s.length > TOOL_OUTPUT_CAP
    ? s.slice(0, TOOL_OUTPUT_CAP) + `\n…[cắt bớt, còn ${s.length - TOOL_OUTPUT_CAP} ký tự]`
    : s;

const resolve = (ctx, p) => (path.isAbsolute(p) ? p : path.join(ctx.cwd, p));

function sh(command, cwd, timeout = 120000) {
  return new Promise((resolve) => {
    execFile("bash", ["-c", command], { cwd, timeout, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      const out = (stdout || "") + (stderr ? (stdout ? "\n" : "") + stderr : "");
      const code = err && typeof err.code === "number" ? err.code : err ? 1 : 0;
      let s = out.trim();
      if (err && err.killed) s += `\n[timeout sau ${timeout}ms]`;
      resolve(`(exit ${code})\n${s || "(no output)"}`);
    });
  });
}

export const TOOLS = {
  read_file: {
    schema: {
      type: "function",
      function: {
        name: "read_file",
        description: "Đọc nội dung 1 file text. Trả về kèm số dòng.",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string", description: "đường dẫn file (tuyệt đối hoặc tương đối cwd)" },
          },
          required: ["path"],
        },
      },
    },
    needsApproval: false,
    preview: (a) => a.path,
    async run(a, ctx) {
      const f = resolve(ctx, a.path);
      if (!fs.existsSync(f)) return `LỖI: không tìm thấy ${a.path}`;
      const data = fs.readFileSync(f, "utf8");
      const numbered = data
        .split("\n")
        .map((l, i) => `${String(i + 1).padStart(5)}  ${l}`)
        .join("\n");
      return cap(numbered);
    },
  },

  write_file: {
    schema: {
      type: "function",
      function: {
        name: "write_file",
        description: "Ghi (tạo mới hoặc đè) toàn bộ nội dung 1 file. Tự tạo thư mục cha.",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string" },
            content: { type: "string" },
          },
          required: ["path", "content"],
        },
      },
    },
    needsApproval: true,
    preview: (a) => `${a.path} (${a.content.length} bytes)`,
    async run(a, ctx) {
      const f = resolve(ctx, a.path);
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, a.content);
      return `OK: đã ghi ${a.path} (${a.content.length} bytes)`;
    },
  },

  edit_file: {
    schema: {
      type: "function",
      function: {
        name: "edit_file",
        description:
          "Thay thế chuỗi trong file. old_string phải khớp duy nhất (trừ khi replace_all=true).",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string" },
            old_string: { type: "string" },
            new_string: { type: "string" },
            replace_all: { type: "boolean" },
          },
          required: ["path", "old_string", "new_string"],
        },
      },
    },
    needsApproval: true,
    preview: (a) => a.path,
    async run(a, ctx) {
      const f = resolve(ctx, a.path);
      if (!fs.existsSync(f)) return `LỖI: không tìm thấy ${a.path}`;
      const data = fs.readFileSync(f, "utf8");
      const count = data.split(a.old_string).length - 1;
      if (count === 0) return `LỖI: không tìm thấy old_string trong ${a.path}`;
      if (count > 1 && !a.replace_all)
        return `LỖI: old_string khớp ${count} chỗ. Thêm replace_all=true hoặc cho chuỗi dài hơn.`;
      const next = a.replace_all
        ? data.split(a.old_string).join(a.new_string)
        : data.replace(a.old_string, a.new_string);
      fs.writeFileSync(f, next);
      return `OK: sửa ${a.path} (${a.replace_all ? count : 1} chỗ)`;
    },
  },

  list_dir: {
    schema: {
      type: "function",
      function: {
        name: "list_dir",
        description: "Liệt kê file/thư mục trong 1 đường dẫn.",
        parameters: {
          type: "object",
          properties: { path: { type: "string" } },
          required: ["path"],
        },
      },
    },
    needsApproval: false,
    preview: (a) => a.path,
    async run(a, ctx) {
      const d = resolve(ctx, a.path);
      if (!fs.existsSync(d)) return `LỖI: không tìm thấy ${a.path}`;
      const items = fs.readdirSync(d, { withFileTypes: true });
      return cap(
        items
          .map((e) => (e.isDirectory() ? e.name + "/" : e.name))
          .sort()
          .join("\n") || "(rỗng)",
      );
    },
  },

  grep: {
    schema: {
      type: "function",
      function: {
        name: "grep",
        description: "Tìm pattern (regex) trong code. Dùng ripgrep nếu có.",
        parameters: {
          type: "object",
          properties: {
            pattern: { type: "string" },
            path: { type: "string", description: "thư mục/file, mặc định cwd" },
          },
          required: ["pattern"],
        },
      },
    },
    needsApproval: false,
    preview: (a) => `"${a.pattern}" trong ${a.path || "."}`,
    async run(a, ctx) {
      const where = a.path ? resolve(ctx, a.path) : ctx.cwd;
      const q = a.pattern.replace(/'/g, "'\\''");
      const cmd = `command -v rg >/dev/null 2>&1 && rg -n --no-heading -e '${q}' '${where}' || grep -rnI -e '${q}' '${where}'`;
      return cap(await sh(cmd, ctx.cwd, 30000));
    },
  },

  bash: {
    schema: {
      type: "function",
      function: {
        name: "bash",
        description:
          "Chạy lệnh shell bash trong cwd của project. Dùng để build, test, git, cài deps, chạy code...",
        parameters: {
          type: "object",
          properties: {
            command: { type: "string" },
            timeout_ms: { type: "number" },
          },
          required: ["command"],
        },
      },
    },
    needsApproval: true,
    preview: (a) => a.command,
    async run(a, ctx) {
      return cap(await sh(a.command, ctx.cwd, a.timeout_ms || 120000));
    },
  },
};

export function toolSchemas(extra = []) {
  return [...Object.values(TOOLS).map((t) => t.schema), ...extra];
}
