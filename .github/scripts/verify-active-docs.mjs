import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const docRoots = [".agents/notes", ".agents/rules", "packages/stack"];
const documents = [".agents/AGENTS.md", "README.md"];

// These are invalid source locations and inactive rule/document identifiers.
// Keep this check focused on retired *references*, not on words such as
// "migration" used for valid database or release behavior.
const invalid = [
  {
    name: "retired source path",
    re: /\b(?:src\/packages\/|publish\/(?:packs|plugins|extensions)\/|_migrate\/|plugins\/(?:Cognition|DarkFactory|dsh-tui)\/)/g,
  },
  { name: "retired product name", re: /\bKiKi\b/g },
  {
    name: "inactive document link",
    re: /(?:plugin-extension-and-pack-model\.md|plugin-and-pack-contract\.md|closure-verification\.md|legacy-quarantine\.md|sidebar-workspace-pass\.md|ci-node-architecture\.md|\.agents\/requests\/)/g,
  },
];

/**
 * Return forbidden document references with their descriptive rule names.
 * @param {string} content Markdown content to validate.
 * @returns {string[]} The violating rules.
 */
export function findInvalidReferences(content) {
  return invalid
    .filter(({ re }) => {
      re.lastIndex = 0;
      return re.test(content);
    })
    .map(({ name }) => name);
}

/**
 * List Markdown source documents without inspecting generated artifacts.
 * @param {string} dir Absolute directory to inspect.
 * @returns {string[]} All Markdown file paths below it.
 */
function markdownFiles(dir) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (["node_modules", "dist", "lib", "build"].includes(entry.name)) continue;
      files.push(...markdownFiles(join(dir, entry.name)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(join(dir, entry.name));
    }
  }
  return files;
}

/** Fail verification when active documentation contains invalid references. */
function verify() {
  const paths = [
    ...documents.map((p) => resolve(root, p)),
    ...docRoots.flatMap((p) => markdownFiles(resolve(root, p))),
  ];
  const errors = [];
  for (const path of paths) {
    const violations = findInvalidReferences(readFileSync(path, "utf8"));
    if (violations.length > 0) {
      errors.push(`${relative(root, path)}: ${violations.join(", ")}`);
    }
  }
  if (errors.length > 0) {
    console.error("Invalid active documentation references:\n" + errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`Active documentation verified: ${paths.length} Markdown file(s).`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) verify();
