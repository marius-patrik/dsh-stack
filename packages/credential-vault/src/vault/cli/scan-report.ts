import { formatFingerprint } from "./fingerprint.js";
import { redactFinding, type Finding } from "./scan-finding.js";

/** table implementation. */
export function table(rows: readonly (readonly string[])[]): string {
  if (rows.length === 0) return "";
  const widths: number[] = [];
  for (const row of rows)
    row.forEach((cell, index) => (widths[index] = Math.max(widths[index] ?? 0, cell.length)));
  return rows
    .map((row) =>
      row
        .map((cell, index) => (index === row.length - 1 ? cell : cell.padEnd(widths[index] ?? 0)))
        .join("  ")
        .trimEnd(),
    )
    .join("\n");
}

/** renderScanReport implementation. */
export function renderScanReport(findings: readonly Finding[], nowMs: number): string {
  if (findings.length === 0) return "no credentials found\n";
  const rows: string[][] = [
    ["PROVIDER", "TYPE", "ACCOUNT", "EXPIRY", "PLAN", "SOURCE", "FINGERPRINT", "ID"],
  ];
  for (const finding of findings) {
    const redacted = redactFinding(finding, nowMs);
    rows.push([
      finding.provider,
      finding.type,
      finding.account ?? "-",
      finding.expiresAt ? `${finding.expiresAt}${redacted.expired ? " EXPIRED" : ""}` : "-",
      finding.plan,
      `${finding.origin.kind}:${finding.origin.location}`,
      finding.fingerprints.map(formatFingerprint).join(" ") || "(not read)",
      finding.suggestedId,
    ]);
  }
  const notes = findings.flatMap((finding) =>
    finding.notes.map((note) => `  ${finding.suggestedId}: ${note}`),
  );
  return `${table(rows)}\n${notes.length > 0 ? `\nnotes:\n${notes.join("\n")}\n` : ""}`;
}
