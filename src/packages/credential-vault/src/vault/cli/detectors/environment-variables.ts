import { SecretValue } from "../../secret.js";
import type { SecretMaterial } from "../../record.js";
import { fingerprintsOf } from "../material-from-input.js";
import { origin, slugify, type Detector, type Finding } from "../scan-finding.js";

/**
 * Environment variables that name themselves as credentials. A denylist keeps
 * the obvious false positives out: a shell session key and a CI job token are
 * not credentials the owner needs kept alive.
 */
const CREDENTIAL_ENV = /_(API_KEY|TOKEN)$/;
const ENV_DENYLIST = new Set([
  "STARSHIP_SESSION_KEY",
  "GITHUB_ACTIONS_RUNTIME_TOKEN",
  "ACTIONS_RUNTIME_TOKEN",
  "ANDROMEDA_VAULT_PASSPHRASE",
]);

export const environmentVariables: Detector = {
  name: "environment-variables",
  provider: "environment",
  /** detect implementation. */
  async detect(source, context) {
    const environment = await source.environment();
    const findings: Finding[] = [];
    for (const [name, value] of Object.entries(environment).sort(([left], [right]) =>
      left.localeCompare(right),
    )) {
      if (!CREDENTIAL_ENV.test(name) || ENV_DENYLIST.has(name) || !value.trim()) continue;
      const material: SecretMaterial = {
        type: "api_key",
        apiKey: new SecretValue(value.trim()),
        header: null,
      };
      findings.push({
        detector: this.name,
        provider: providerFromEnvName(name),
        type: "api_key",
        suggestedId: slugify("env", name, source.machine),
        label: `${name} from the environment on ${source.machine}`,
        purpose: `env/${slugify(name)}`,
        account: null,
        expiresAt: null,
        plan: "metered_api_key",
        origin: origin(source, "environment", name, context),
        fingerprints: fingerprintsOf(material),
        notes: ["exported in the shell environment: readable by every process the owner runs"],
        material,
      });
    }
    return findings;
  },
};

/** providerFromEnvName implementation. */
function providerFromEnvName(name: string): string {
  const head = name.replace(/_(API_KEY|TOKEN)$/, "").toLowerCase();
  return head || "environment";
}
