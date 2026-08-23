import { readFile } from "node:fs/promises";

const packageId = new URL(".", import.meta.url).pathname.split("/").filter(Boolean).at(-2);
if (!packageId) throw new Error("Unable to resolve canonical package directory");

const packageUrl = new URL(`../../../packages/${packageId}/package.json`, import.meta.url);
const manifest = JSON.parse(await readFile(packageUrl, "utf8"));
if (typeof manifest.name !== "string" || !manifest.name)
  throw new Error(`Canonical package ${packageId} has no package name`);

const implementation = await import(manifest.name);

export { implementation };
export const register = implementation.register;
export default implementation.default ?? implementation;
