/** A fault the owner can fix by retyping the command. Reported without a stack. */
export class VaultCliError extends Error {
  /** Constructs an instance. */
  constructor(message: string) {
    super(message);
    this.name = "VaultCliError";
  }
}

export interface ParsedArguments {
  positional: readonly string[];
  /** Repeatable by design: `--agent` and `--tag` are lists. */
  options: ReadonlyMap<string, readonly string[]>;
  booleans: ReadonlySet<string>;
}

/**
 * `--name value`, `--name=value`, and bare `--name`. Deliberately small: the
 * commands here take no secret material on argv, so there is nothing subtle for
 * a parser to get wrong, and a hand-rolled twenty lines is easier to audit than
 * a dependency.
 */
export function parseVaultArguments(argv: readonly string[]): ParsedArguments {
  const positional: string[] = [];
  const options = new Map<string, string[]>();
  const booleans = new Set<string>();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index] as string;
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    const body = token.slice(2);
    const equals = body.indexOf("=");
    if (equals !== -1) {
      push(options, body.slice(0, equals), body.slice(equals + 1));
      continue;
    }
    const next = argv[index + 1];
    if (next === undefined || next.startsWith("--")) {
      booleans.add(body);
      continue;
    }
    push(options, body, next);
    index += 1;
  }
  return { positional, options, booleans };
}

/** push implementation. */
function push(map: Map<string, string[]>, key: string, value: string): void {
  const existing = map.get(key);
  if (existing) existing.push(value);
  else map.set(key, [value]);
}

/** optional implementation. */
export function optional(args: ParsedArguments, name: string): string | null {
  return args.options.get(name)?.at(-1) ?? null;
}

/** many implementation. */
export function many(args: ParsedArguments, name: string): string[] {
  return [...(args.options.get(name) ?? [])];
}

/** required implementation. */
export function required(args: ParsedArguments, name: string): string {
  const value = optional(args, name);
  if (!value) throw new VaultCliError(`--${name} is required`);
  return value;
}

/** boolean implementation. */
export function boolean(args: ParsedArguments, name: string): boolean {
  return args.booleans.has(name) || optional(args, name) === "true";
}
