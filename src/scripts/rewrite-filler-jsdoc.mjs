/**
 * Replace auto-generated filler doc comments with real contract documentation,
 * using the local inference server rather than a frontier model.
 *
 * The tree carries hundreds of comments of the form `/** foo implementation. *\/`
 * -- mechanically complete, semantically empty. A comment that restates the
 * identifier carries no information but reads as though the function is
 * documented, which suppresses ever writing a real one (#117).
 *
 * This is exactly the shape of work worth sending to a local model: high
 * volume, low judgement, and every result is independently checkable. Nothing
 * here trusts the model -- each reply must survive `isAcceptableDoc` before it
 * is written, and anything rejected leaves the original comment untouched for a
 * human to handle.
 *
 * Usage:
 *   node src/scripts/rewrite-filler-jsdoc.mjs --dry-run
 *   node src/scripts/rewrite-filler-jsdoc.mjs --package providers --limit 20
 *
 * @module @dsh-stack/scripts/rewrite-filler-jsdoc
 */
import { promises as fs } from "node:fs";
import { join, relative } from "node:path";
import { completeLocally, LOCAL_MODEL, listLocalModels } from "./local-model-client.mjs";
import { resolveRepoRoot } from "./lib/resolve-repo-root.mjs";
import { walkSourceTree } from "./lib/walk-source-tree.mjs";

const root = resolveRepoRoot(import.meta.url);

/** Matches the generated filler form, capturing the name it restates. */
const FILLER = /\/\*\* ([A-Za-z0-9_$]+) implementation\. \*\//g;

/** Lines of context handed to the model on each side of the declaration. */
const CONTEXT_LINES = 24;

/** Instruction fixed for every call: the transformation and the output shape. */
const SYSTEM = [
  "You write JSDoc for TypeScript and JavaScript.",
  "Given a function and its surrounding code, write ONE JSDoc comment describing its contract:",
  "what the caller must guarantee, what it returns or guarantees back, and what it does on the failure path.",
  "Rules:",
  "- Output ONLY the comment block, starting with /** and ending with */. No code, no prose around it.",
  "- Never restate the function name as the description. 'clonePanes clones panes' is worthless.",
  "- Describe observable behaviour, not implementation steps.",
  "- Keep it under 4 lines unless parameters genuinely need documenting.",
  "- Do not invent parameters or behaviour that the code does not show.",
].join("\n");

/**
 * Decide whether a reply is safe to write.
 *
 * The bar is deliberately mechanical: a local model will occasionally answer
 * with code, with prose, with several comments, or by restating the name it was
 * asked not to restate. Each of those is detectable without judgement, and
 * rejecting is always safe because the original comment stays.
 *
 * @param text - the model's reply.
 * @param name - the identifier the filler comment restated.
 * @returns the normalised comment, or null when it must not be used.
 */
export function isAcceptableDoc(text, name, context = "", isTypeScript = false, seen = null) {
  if (!text) return null;
  const start = text.indexOf("/**");
  const end = text.indexOf("*/", start + 3);
  if (start === -1 || end === -1) return null;
  const block = text.slice(start, end + 2);
  // More than one comment means the model answered with a file, not a comment.
  if (block.slice(3).includes("/**")) return null;
  const body = block
    .slice(3, -2)
    .split("\n")
    .map((line) => line.replace(/^\s*\*?\s?/, "").trim())
    .filter(Boolean);
  if (body.length === 0) return null;
  const prose = body.filter((line) => !line.startsWith("@")).join(" ");
  // Empty of description, or the same restatement we are trying to remove.
  if (prose.length < 20) return null;
  if (new RegExp(`^${name}\\b.{0,30}implementation`, "i").test(prose)) return null;
  if (/\bimplementation\.?$/i.test(prose.trim())) return null;
  // Guard the placeholder markers verify-stack.mjs rejects outright.
  if (/\b(todo|fixme|not implemented)\b/i.test(block)) return null;

  // Fabricated failure modes, all observed from a 7B on this exact task and all
  // mechanically detectable. Rejecting is always safe: the filler comment stays,
  // and an empty-but-honest comment beats a confident lie.

  // 1. A documented throw where the code never throws. The model reliably
  //    invents "@throws if the id is invalid" for functions that clamp or
  //    return unchanged.
  if (/@throws/.test(block) && !/\bthrow\b/.test(context)) return null;

  // 2. JSDoc type annotations in TypeScript, where the signature already
  //    carries the types and the comment's copy can silently contradict it.
  if (isTypeScript && /@(param|returns?)\s*\{/.test(block)) return null;

  // 3. The same description handed back for a different function. Observed
  //    verbatim: closeOtherTabs documented as "Closes the specified tab",
  //    which is the neighbouring function's contract, not its own.
  if (seen) {
    const key = prose.toLowerCase().replace(/\s+/g, " ").slice(0, 120);
    if (seen.has(key)) return null;
    seen.add(key);
  }

  return block;
}

/** Re-indents a comment block so every line sits at `indent`. */
function reindent(block, indent) {
  const [first, ...rest] = block.split("\n");
  return [
    first,
    ...rest.map((line) => `${indent}${line.trim().replace(/^\*/, "*").replace(/^/, " ")}`),
  ].join("\n");
}

/**
 * Replace one filler comment, hoisting it out of a declaration when the
 * generator wedged it there.
 *
 * 34 of these sit between `const` and the identifier -- `const /** x *\/ name =`
 * -- which is a syntax-level defect in its own right. Substituting a longer
 * comment in place makes that materially worse, so those are rewritten as a
 * comment above the declaration instead of inside it.
 *
 * @returns the updated source, or null when the occurrence could not be placed
 *   safely and should be left alone.
 */
export function applyDoc(text, filler, block) {
  const at = text.indexOf(filler);
  if (at === -1) return null;

  const lineStart = text.lastIndexOf("\n", at) + 1;
  const before = text.slice(lineStart, at);
  const indent = (before.match(/^\s*/) ?? [""])[0];

  // The wedged form: `const /** x */\n  name = ...`. Substituting a longer
  // comment in place would deepen a defect that is already syntactic, so the
  // declaration keyword is rejoined to its identifier and the comment moves
  // above the whole declaration.
  const keyword = before.trim().match(/^(const|let|var)$/)?.[1];
  if (keyword) {
    const after = text.slice(at + filler.length);
    const rejoined = after.replace(/^\s*\n\s*/, " ");
    if (rejoined === after) return null;
    return `${text.slice(0, lineStart)}${indent}${reindent(block, indent)}\n${indent}${keyword}${rejoined}`;
  }

  return `${text.slice(0, at)}${reindent(block, indent).trimStart()}${text.slice(at + filler.length)}`;
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const pkgArg = args[args.indexOf("--package") + 1];
const limitArg = Number(args[args.indexOf("--limit") + 1]);
const limit = Number.isFinite(limitArg) && limitArg > 0 ? limitArg : Infinity;

const served = await listLocalModels();
if (served === null) {
  console.error(
    "rewrite-filler-jsdoc: no local inference server reachable.\n" +
      "Start one (e.g. mlx_lm.server) or set DSH_LOCAL_MODEL_URL.",
  );
  process.exit(1);
}
console.log(`local server: ${served.length} model(s); using ${LOCAL_MODEL}`);

const searchRoot = pkgArg ? join(root, "src", "packages", pkgArg) : join(root, "src", "packages");
/** Descriptions already accepted, so one function's contract is not reused for another. */
const seenDescriptions = new Set();
let examined = 0;
let rewritten = 0;
let rejected = 0;

for await (const file of walkSourceTree(searchRoot, { extensions: ["ts", "tsx", "mjs", "js"] })) {
  let text = await fs.readFile(file, "utf8");
  const matches = [...text.matchAll(FILLER)];
  if (matches.length === 0) continue;

  for (const match of matches) {
    if (examined >= limit) break;
    examined += 1;
    const [full, name] = match;
    const lines = text.split("\n");
    const lineIndex = text.slice(0, match.index).split("\n").length - 1;
    const context = lines.slice(Math.max(0, lineIndex - 2), lineIndex + CONTEXT_LINES).join("\n");
    const indent = (lines[lineIndex].match(/^\s*/) ?? [""])[0];

    const reply = await completeLocally(
      SYSTEM,
      `Write the JSDoc for \`${name}\`.\n\n\`\`\`\n${context}\n\`\`\``,
      { maxTokens: 220 },
    );
    const block = isAcceptableDoc(reply, name, context, /\.tsx?$/.test(file), seenDescriptions);
    if (!block) {
      rejected += 1;
      console.log(`  reject ${relative(root, file)}:${lineIndex + 1} ${name}`);
      continue;
    }
    if (!dryRun) {
      const next = applyDoc(text, full, block);
      if (next === null || next === text) {
        rejected += 1;
        console.log(
          `  reject ${relative(root, file)}:${lineIndex + 1} ${name} (could not place safely)`,
        );
        continue;
      }
      text = next;
      await fs.writeFile(file, text);
    }
    rewritten += 1;
    console.log(
      `  ${dryRun ? "would write" : "wrote"} ${relative(root, file)}:${lineIndex + 1} ${name}`,
    );
  }
  if (examined >= limit) break;
}

console.log(
  `\nexamined ${examined}, ${dryRun ? "would rewrite" : "rewrote"} ${rewritten}, rejected ${rejected}`,
);
console.log(
  "Run pnpm typecheck and pnpm verify before committing: nothing here is trusted unverified.",
);
