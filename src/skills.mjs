// Skill system — markdown files with frontmatter, loaded on demand (like Claude Code skills).
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));

// Search order: bundled skills, project .taw/skills, user ~/.taw/skills
function skillDirs(cwd) {
  return [
    path.join(__dir, "..", "skills"),
    path.join(cwd, ".taw", "skills"),
    path.join(os.homedir(), ".taw", "skills"),
  ].filter((d) => fs.existsSync(d));
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: m[2].trim() };
}

export function loadSkills(cwd) {
  const skills = new Map(); // name -> {name, description, body}
  for (const dir of skillDirs(cwd)) {
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".md")) continue;
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { meta, body } = parseFrontmatter(raw);
      const name = meta.name || file.replace(/\.md$/, "");
      if (!skills.has(name))
        skills.set(name, { name, description: meta.description || "", body });
    }
  }
  return skills;
}

export function skillsIndex(skills) {
  if (skills.size === 0) return "";
  return [...skills.values()]
    .map((s) => `  - ${s.name}: ${s.description}`)
    .join("\n");
}

export function loadSkillTool(skills) {
  return {
    schema: {
      type: "function",
      function: {
        name: "load_skill",
        description:
          "Load a skill's detailed playbook when the task is related. Returns the skill content to follow.",
        parameters: {
          type: "object",
          properties: { name: { type: "string", description: "skill name" } },
          required: ["name"],
        },
      },
    },
    needsApproval: false,
    preview: (a) => a.name,
    async run(a) {
      const s = skills.get(a.name);
      if (!s) return `ERROR: no skill "${a.name}". Available: ${[...skills.keys()].join(", ")}`;
      return `# Skill: ${s.name}\n\n${s.body}`;
    },
  };
}
