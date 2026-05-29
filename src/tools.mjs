// Tool registry — the model's hands. Each tool: {schema, run(args, ctx)}.
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { TOOL_OUTPUT_CAP } from "./config.mjs";

const cap = (s) =>
  s.length > TOOL_OUTPUT_CAP
    ? s.slice(0, TOOL_OUTPUT_CAP) + `\n…[truncated, ${s.length - TOOL_OUTPUT_CAP} more chars]`
    : s;

const resolve = (ctx, p) => (path.isAbsolute(p) ? p : path.join(ctx.cwd, p));

function sh(command, cwd, timeout = 120000) {
  return new Promise((resolve) => {
    execFile("bash", ["-c", command], { cwd, timeout, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      const out = (stdout || "") + (stderr ? (stdout ? "\n" : "") + stderr : "");
      const code = err && typeof err.code === "number" ? err.code : err ? 1 : 0;
      let s = out.trim();
      if (err && err.killed) s += `\n[timed out after ${timeout}ms]`;
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
        description: "Read the contents of a text file. Returns it with line numbers.",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string", description: "file path (absolute or relative to cwd)" },
          },
          required: ["path"],
        },
      },
    },
    needsApproval: false,
    preview: (a) => a.path,
    async run(a, ctx) {
      const f = resolve(ctx, a.path);
      if (!fs.existsSync(f)) return `ERROR: not found ${a.path}`;
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
        description: "Write (create or overwrite) a file's full contents. Creates parent dirs.",
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
      return `OK: wrote ${a.path} (${a.content.length} bytes)`;
    },
  },

  edit_file: {
    schema: {
      type: "function",
      function: {
        name: "edit_file",
        description:
          "Replace a string in a file. old_string must match exactly once (unless replace_all=true).",
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
      if (!fs.existsSync(f)) return `ERROR: not found ${a.path}`;
      const data = fs.readFileSync(f, "utf8");
      const count = data.split(a.old_string).length - 1;
      if (count === 0) return `ERROR: old_string not found in ${a.path}`;
      if (count > 1 && !a.replace_all)
        return `ERROR: old_string matches ${count} places. Add replace_all=true or use a longer string.`;
      const next = a.replace_all
        ? data.split(a.old_string).join(a.new_string)
        : data.replace(a.old_string, a.new_string);
      fs.writeFileSync(f, next);
      return `OK: edited ${a.path} (${a.replace_all ? count : 1} place${a.replace_all && count > 1 ? "s" : ""})`;
    },
  },

  list_dir: {
    schema: {
      type: "function",
      function: {
        name: "list_dir",
        description: "List files/directories at a path.",
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
      if (!fs.existsSync(d)) return `ERROR: not found ${a.path}`;
      const items = fs.readdirSync(d, { withFileTypes: true });
      return cap(
        items
          .map((e) => (e.isDirectory() ? e.name + "/" : e.name))
          .sort()
          .join("\n") || "(empty)",
      );
    },
  },

  grep: {
    schema: {
      type: "function",
      function: {
        name: "grep",
        description: "Search for a regex pattern in code. Uses ripgrep if available.",
        parameters: {
          type: "object",
          properties: {
            pattern: { type: "string" },
            path: { type: "string", description: "dir/file, defaults to cwd" },
          },
          required: ["pattern"],
        },
      },
    },
    needsApproval: false,
    preview: (a) => `"${a.pattern}" in ${a.path || "."}`,
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
          "Run a bash shell command in the project cwd. Use for build, test, git, installing deps, running code...",
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
