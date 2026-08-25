import { promises as fs } from "node:fs";
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

/** Return true when a declaration has a JSDoc comment immediately attached to it. */
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
        line: start.line + 1,
        name,
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return missing;
}

/** Add JSDoc to every undocumented function-like declaration in the repository. */
async function main() {
  const files = (
    await Promise.all(sourceRoots.map((rootName) => collectFiles(join(root, rootName))))
  ).flat();
  let changedFiles = 0;
  let added = 0;

  for (const path of files.sort()) {
    let source = await fs.readFile(path, "utf8");
    let fileAdded = 0;

    for (let pass = 0; pass < 5; pass += 1) {
      const missing = collectMissing(source, path);
      if (missing.length === 0) break;

      for (const insertion of [...missing].sort((a, b) => b.position - a.position)) {
        source = `${source.slice(0, insertion.position)}${insertion.text}${source.slice(insertion.position)}`;
      }
      fileAdded += missing.length;
    }

    if (fileAdded === 0) continue;
    const remaining = collectMissing(source, path);
    if (remaining.length > 0) {
      throw new Error(`${path}: unable to document ${remaining.length} declaration(s)`);
    }
    await fs.writeFile(path, source);
    changedFiles += 1;
    added += fileAdded;
  }

  console.log(`Added ${added} JSDoc blocks across ${changedFiles} source file(s).`);
}

await main();
