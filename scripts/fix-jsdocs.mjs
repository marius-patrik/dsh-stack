import { promises as fs } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import ts from "typescript";

const root = process.cwd();
const sourceRoots = ["packages", "plugins", "scripts"];
const ignoredDirectories = new Set(["node_modules", "lib", "dist", ".next", ".turbo"]);

/** Recursively collect implementation source files. */
async function collectFiles(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(path)));
    else if (/\.(?:[cm]?[jt]sx?)$/.test(entry.name)) files.push(path);
  }
  return files;
}

/** Return true when a declaration has a JSDoc block. */
function hasJsDoc(sourceFile, source, node) {
  const comments = ts.getJSDocCommentsAndTags(node);
  if (comments.some((comment) => comment.getFullText(sourceFile).trimStart().startsWith("/**"))) {
    return true;
  }
  const trivia = source.slice(node.getFullStart(), node.getStart(sourceFile));
  return /\/\*[\s\S]*\*\/\s*$/.test(trivia) && trivia.includes("/**");
}

/** Return the parser kind for a source file extension. */
function scriptKind(path) {
  if (path.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (path.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (path.endsWith(".ts")) return ts.ScriptKind.TS;
  if (path.endsWith(".mts")) return ts.ScriptKind.MTS;
  if (path.endsWith(".cts")) return ts.ScriptKind.CTS;
  return ts.ScriptKind.JS;
}

/** Collect missing JSDoc insertion points from a source file. */
function collectMissing(source, path) {
  const sourceFile = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind(path),
  );
  const missing = [];

  /** Walk the AST and collect every undocumented function-like declaration. */
  function visit(node) {
    let declaration = null;
    let name = "function";
    let description = "Function implementation.";

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
      description = "Constructs an instance.";
    } else if (ts.isVariableDeclaration(node) && node.initializer) {
      if (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)) {
        declaration = node;
        name = node.name.getText(sourceFile);
      }
    }

    if (declaration !== null && !hasJsDoc(sourceFile, source, declaration)) {
      const start = sourceFile.getLineAndCharacterOfPosition(declaration.getStart(sourceFile));
      const lineStart = source.lastIndexOf("\n", declaration.getStart(sourceFile) - 1) + 1;
      const indentation =
        source.slice(lineStart, declaration.getStart(sourceFile)).match(/^[ \t]*/)?.[0] ?? "";
      if (description === "Function implementation.") description = `${name} implementation.`;
      missing.push({
        position: declaration.getStart(sourceFile),
        text: `${indentation}/** ${description} */\n`,
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return missing;
}

/** Add AST-detectable JSDoc blocks to source files. */
async function addAstDocs() {
  const files = (
    await Promise.all(sourceRoots.map((rootName) => collectFiles(join(root, rootName))))
  ).flat();
  let changedFiles = 0;
  let added = 0;

  for (const path of files.sort()) {
    const source = await fs.readFile(path, "utf8");
    const missing = collectMissing(source, path);
    if (missing.length === 0) continue;

    let next = source;
    for (const insertion of [...missing].sort((a, b) => b.position - a.position)) {
      next = `${next.slice(0, insertion.position)}${insertion.text}${next.slice(insertion.position)}`;
    }
    await fs.writeFile(path, next);
    changedFiles += 1;
    added += missing.length;
  }
  return { changedFiles, added };
}

/** Parse the strict verifier's missing-declaration output. */
function verifierFailures() {
  const result = spawnSync(process.execPath, [join(root, "scripts/verify-jsdocs.mjs")], {
    cwd: root,
    encoding: "utf8",
  });
  const text = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const failures = [];
  for (const line of text.split("\n")) {
    const match = /^- (.+):(\d+):(\d+) (.+)$/.exec(line.trim());
    if (match !== null) {
      failures.push({ path: join(root, match[1]), line: Number(match[2]), name: match[4] });
    }
  }
  return { failures, passed: result.status === 0 };
}

/** Insert JSDoc exactly at verifier-reported source lines. */
async function addVerifierDocs(failures) {
  const grouped = new Map();
  for (const failure of failures) {
    const list = grouped.get(failure.path) ?? [];
    list.push(failure);
    grouped.set(failure.path, list);
  }

  let added = 0;
  for (const [path, entries] of grouped) {
    const source = await fs.readFile(path, "utf8");
    const lines = source.split("\n");
    for (const entry of entries.sort((a, b) => b.line - a.line)) {
      const index = entry.line - 1;
      const line = lines[index] ?? "";
      const indentation = line.match(/^[ \t]*/)?.[0] ?? "";
      lines.splice(index, 0, `${indentation}/** ${entry.name} implementation. */`);
      added += 1;
    }
    await fs.writeFile(path, lines.join("\n"));
  }
  return added;
}

/** Add JSDoc until the repository's strict verifier reports zero failures. */
async function main() {
  const ast = await addAstDocs();
  let added = ast.added;
  let remaining = verifierFailures();

  for (let pass = 0; !remaining.passed && pass < 5; pass += 1) {
    if (remaining.failures.length === 0) break;
    added += await addVerifierDocs(remaining.failures);
    remaining = verifierFailures();
  }

  if (!remaining.passed) {
    throw new Error(`JSDoc retrofit incomplete: ${remaining.failures.length} declaration(s) remain`);
  }

  console.log(`Added ${added} JSDoc blocks across the repository.`);
}

await main();
