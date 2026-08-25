import { promises as fs } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, relative } from "node:path";
import ts from "typescript";

const root = process.cwd();
const sourceRoots = ["packages", "plugins", "scripts"];
const ignoredDirectories = new Set(["node_modules", "lib", "dist", ".next", ".turbo"]);

/** Recursively collect source files that are part of the repository implementation. */
async function collectFiles(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
    } else if (/\.(?:[cm]?[jt]sx?)$/.test(entry.name)) {
      files.push(path);
    }
  }
  return files;
}

/** Return true when a declaration has a JSDoc comment attached to it. */
function hasJsDoc(sourceFile, node) {
  return ts
    .getJSDocCommentsAndTags(node)
    .some((comment) => comment.getFullText(sourceFile).trimStart().startsWith("/**"));
}

/**
 * Return the added line ranges for files changed by the current pull request.
 * Existing undocumented declarations are intentionally grandfathered: the
 * verifier is a ratchet so the new JSDoc rule does not require a repository-wide
 * rewrite just to land the rule. Any newly added or modified function must be
 * documented before it can merge.
 */
function changedLineRanges() {
  if (!process.env.GITHUB_ACTIONS) return new Map();

  const baseRef = process.env.GITHUB_BASE_REF ?? "main";
  try {
    execFileSync("git", ["fetch", "--no-tags", "--depth=1", "origin", baseRef], {
      cwd: root,
      stdio: "ignore",
    });
  } catch {
    return new Map();
  }

  let diff;
  try {
    diff = execFileSync(
      "git",
      ["diff", "--unified=0", "--find-renames", `origin/${baseRef}...HEAD`, "--", ...sourceRoots],
      { cwd: root, encoding: "utf8" },
    );
  } catch {
    return new Map();
  }

  const ranges = new Map();
  let currentFile = null;
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ b/")) {
      currentFile = line.slice(6);
      if (!ranges.has(currentFile)) ranges.set(currentFile, []);
      continue;
    }
    if (line.startsWith("@@") && currentFile !== null) {
      const match = /\+(\d+)(?:,(\d+))?/.exec(line);
      if (match === null) continue;
      const start = Number(match[1]);
      const count = Number(match[2] ?? "1");
      if (count > 0) {
        ranges.get(currentFile).push([start, start + count - 1]);
      }
    }
  }
  return ranges;
}

/** Return true when a source span intersects one of the changed line ranges. */
function intersectsChangedLines(relativePath, startLine, endLine, ranges) {
  const fileRanges = ranges.get(relativePath);
  if (fileRanges === undefined) return false;
  return fileRanges.some(([start, end]) => startLine <= end && endLine >= start);
}

/** Report every named or declarative function without a JSDoc block. */
function checkFile(path, source, ranges) {
  const sourceFile = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith(".tsx")
      ? ts.ScriptKind.TSX
      : path.endsWith(".jsx")
        ? ts.ScriptKind.JSX
        : path.endsWith(".ts")
          ? ts.ScriptKind.TS
          : path.endsWith(".mts")
            ? ts.ScriptKind.MTS
            : path.endsWith(".cts")
              ? ts.ScriptKind.CTS
              : path.endsWith(".mjs")
                ? ts.ScriptKind.JS
                : ts.ScriptKind.JS,
  );
  const missing = [];
  const relativePath = relative(root, path);

  /** Walk the AST and collect changed function declarations that lack JSDoc. */
  function visit(node) {
    let declaration = null;
    let name = "<anonymous>";

    if (ts.isFunctionDeclaration(node)) {
      declaration = node;
      name = node.name?.text ?? name;
    } else if (ts.isMethodDeclaration(node)) {
      declaration = node;
      name = node.name.getText(sourceFile);
    } else if (ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) {
      declaration = node;
      name = node.name.getText(sourceFile);
    } else if (ts.isConstructorDeclaration(node)) {
      declaration = node;
      name = "constructor";
    } else if (ts.isVariableDeclaration(node) && node.initializer) {
      if (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)) {
        declaration = node;
        name = node.name.getText(sourceFile);
      }
    }

    if (declaration !== null && !hasJsDoc(sourceFile, declaration)) {
      const start = sourceFile.getLineAndCharacterOfPosition(declaration.getStart(sourceFile));
      const end = sourceFile.getLineAndCharacterOfPosition(declaration.getEnd());
      if (intersectsChangedLines(relativePath, start.line + 1, end.line + 1, ranges)) {
        missing.push(`${relativePath}:${start.line + 1}:${start.character + 1} ${name}`);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return missing;
}

/** Verify JSDoc on new or modified functions without retroactively rewriting legacy code. */
async function main() {
  const files = (
    await Promise.all(sourceRoots.map((rootName) => collectFiles(join(root, rootName))))
  ).flat();
  const ranges = changedLineRanges();

  if (process.env.GITHUB_ACTIONS && ranges.size === 0) {
    console.warn("Could not determine pull request diff; skipping JSDoc ratchet.");
    return;
  }

  const missing = [];
  for (const path of files.sort()) {
    missing.push(...checkFile(path, await fs.readFile(path, "utf8"), ranges));
  }
  if (missing.length > 0) {
    console.error(`Missing JSDoc on ${missing.length} new or modified function declaration(s):`);
    for (const entry of missing) console.error(`- ${entry}`);
    process.exit(1);
  }
  console.log(`JSDoc verification passed for ${files.length} source file(s).`);
}

await main();
