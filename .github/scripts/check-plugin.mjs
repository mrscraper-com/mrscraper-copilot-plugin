#!/usr/bin/env node
// Repository checks for the MrScraper Copilot CLI plugin. No dependencies.
// Usage: node .github/scripts/check-plugin.mjs [repository root]

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? ".");
const pluginDir = path.join(root, "plugins", "mrscraper");
const errors = [];

function readJson(relativePath) {
  const file = path.join(root, relativePath);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(`${relativePath}: ${error.message}`);
    return {};
  }
}

function check(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

const manifest = readJson("plugins/mrscraper/plugin.json");
const mcp = readJson("plugins/mrscraper/mcp.json");
const marketplace = readJson(".github/plugin/marketplace.json");

// Agent Plugins 1.0 manifest: only plugin.json at the plugin root, and the
// non-empty version and description that the awesome-copilot intake requires.
check(manifest.name === "mrscraper", 'plugin.json: name must be "mrscraper"');
for (const field of ["version", "description"]) {
  check(typeof manifest[field] === "string" && manifest[field].trim() !== "", `plugin.json: ${field} must be a non-empty string`);
}
check(/^\d+\.\d+\.\d+$/.test(manifest.version ?? ""), "plugin.json: version must be MAJOR.MINOR.PATCH");
check((manifest.description ?? "").length <= 500, "plugin.json: description must be 500 characters or fewer");
check(Array.isArray(manifest.keywords) && manifest.keywords.length > 0 && manifest.keywords.length <= 10, "plugin.json: keywords must have 1-10 entries");
for (const keyword of manifest.keywords ?? []) {
  check(/^[a-z0-9-]{1,30}$/.test(keyword), `plugin.json: keyword "${keyword}" must be lowercase letters, digits, and hyphens`);
}
for (const legacy of [".plugin/plugin.json", ".claude-plugin/plugin.json", ".github/plugin/plugin.json", ".mcp.json"]) {
  check(!fs.existsSync(path.join(pluginDir, legacy)), `plugins/mrscraper/${legacy}: remove it; Agent Plugins 1.0 uses plugin.json and mcp.json at the plugin root`);
}

// Hosted MCP server: OAuth only, so the configuration must not carry headers.
const servers = Object.entries(mcp.mcpServers ?? {});
check(servers.length === 1, "mcp.json: expected exactly one MCP server");
const server = mcp.mcpServers?.mrscraper ?? {};
check(server.type === "streamable-http", 'mcp.json: mrscraper.type must be "streamable-http"');
check(server.url === "https://mcp.mrscraper.com/mcp", "mcp.json: mrscraper.url must be https://mcp.mrscraper.com/mcp");
check(server.headers === undefined, "mcp.json: mrscraper must not define headers; authentication uses OAuth");

// Marketplace entry must describe the same plugin and version.
const entries = marketplace.plugins ?? [];
check(entries.length === 1, "marketplace.json: expected exactly one plugin entry");
const entry = entries[0] ?? {};
check(entry.name === manifest.name, "marketplace.json: plugin name must match plugin.json");
check(entry.version === manifest.version, "marketplace.json: plugin version must match plugin.json");
check(entry.description === manifest.description, "marketplace.json: plugin description must match plugin.json");
check(marketplace.metadata?.version === manifest.version, "marketplace.json: metadata.version must match plugin.json");
check(path.resolve(root, entry.source ?? "") === pluginDir, "marketplace.json: source must be ./plugins/mrscraper");

// Skills: each directory under skills/ has a SKILL.md whose name matches it.
const expectedSkills = ["mrscraper", "mrscraper-fetch", "mrscraper-serp"];
const skillsDir = path.join(pluginDir, "skills");
const foundSkills = fs.existsSync(skillsDir)
  ? fs.readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()
  : [];
check(JSON.stringify(foundSkills) === JSON.stringify(expectedSkills), `skills: expected ${expectedSkills.join(", ")}; found ${foundSkills.join(", ") || "none"}`);
for (const skill of foundSkills) {
  const file = path.join(skillsDir, skill, "SKILL.md");
  if (!fs.existsSync(file)) {
    errors.push(`skills/${skill}: SKILL.md is missing`);
    continue;
  }
  const text = fs.readFileSync(file, "utf8");
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n/);
  check(Boolean(frontmatter), `skills/${skill}/SKILL.md: missing YAML frontmatter`);
  const name = frontmatter?.[1].match(/^name:\s*(.+)$/m)?.[1].trim();
  check(name === skill, `skills/${skill}/SKILL.md: frontmatter name "${name}" must equal the directory name`);
  check(/^description:\s*\S/m.test(frontmatter?.[1] ?? ""), `skills/${skill}/SKILL.md: frontmatter description is required`);
  check(!/\]\(\.\.\//.test(text), `skills/${skill}/SKILL.md: links outside the skill directory fail vally lint`);
}

// Release notes for the manifest version.
const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
check(changelog.includes(`## ${manifest.version} `), `CHANGELOG.md: add a "## ${manifest.version}" entry`);

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`::error::${error}`);
  }
  process.exit(1);
}

console.log(`ok: mrscraper ${manifest.version}, ${foundSkills.length} skills, MCP ${server.url}`);
