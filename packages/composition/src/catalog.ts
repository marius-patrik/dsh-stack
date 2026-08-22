import type { PackDefinition, PluginDefinition, ProfileDefinition } from "./types.js";

export const plugins: readonly PluginDefinition[] = [
  {
    id: "stack.core.composition",
    version: "0.1.0",
    description: "Stack composition contracts and profile assembly.",
    provides: ["stack.composition"],
  },
  {
    id: "stack.workspace.tabs",
    version: "0.1.0",
    description: "Canonical workspace tab lifecycle and persistence.",
    dependencies: [{ plugin: "stack.core.composition", kind: "required" }],
    provides: ["workspace.tabs"],
  },
  {
    id: "stack.workspace.sidebar",
    version: "0.1.0",
    description: "Canonical sidebar/workspace surface and registration API.",
    dependencies: [
      { plugin: "stack.core.composition", kind: "required" },
      { plugin: "stack.workspace.tabs", kind: "required" },
    ],
    provides: ["workspace.sidebar"],
  },
  {
    id: "stack.ui.icons",
    version: "0.1.0",
    description: "Canonical icon resolution and icon-pack registry.",
    dependencies: [{ plugin: "stack.core.composition", kind: "required" }],
    provides: ["ui.icons"],
  },
  {
    id: "stack.ui.icons.vscode",
    version: "0.1.0",
    description: "VS Code icon-theme format adapter and icon pack provider.",
    dependencies: [{ plugin: "stack.ui.icons", kind: "required" }],
    provides: ["ui.icons.vscode"],
  },
  {
    id: "stack.ui.skin.deepseek",
    version: "0.1.0",
    description: "DeepSeek branded Stack skin.",
    dependencies: [{ plugin: "stack.workspace.sidebar", kind: "required" }],
    provides: ["ui.skin.deepseek"],
  },
  {
    id: "stack.ui.skin.claude",
    version: "0.1.0",
    description: "Claude branded Stack skin.",
    dependencies: [{ plugin: "stack.workspace.sidebar", kind: "required" }],
    provides: ["ui.skin.claude"],
  },
  {
    id: "stack.ui.skin.codex",
    version: "0.1.0",
    description: "Codex branded Stack skin.",
    dependencies: [{ plugin: "stack.workspace.sidebar", kind: "required" }],
    provides: ["ui.skin.codex"],
  },
  {
    id: "stack.planning.core",
    version: "0.1.0",
    description: "Shared project/task planning domain.",
    dependencies: [{ plugin: "stack.core.composition", kind: "required" }],
    provides: ["planning.core"],
  },
  {
    id: "stack.integration.github",
    version: "0.1.0",
    description: "GitHub integration boundary.",
    dependencies: [{ plugin: "stack.planning.core", kind: "optional" }],
    provides: ["integration.github"],
  },
  {
    id: "stack.integration.github-projects",
    version: "0.1.0",
    description: "GitHub Projects integration.",
    dependencies: [
      { plugin: "stack.planning.core", kind: "required" },
      { plugin: "stack.integration.github", kind: "required" },
    ],
    provides: ["integration.github-projects"],
  },
  {
    id: "stack.integration.trello",
    version: "0.1.0",
    description: "Trello integration.",
    dependencies: [{ plugin: "stack.planning.core", kind: "required" }],
    provides: ["integration.trello"],
  },
  {
    id: "stack.coding.darkfactory",
    version: "0.1.0",
    description: "DarkFactory-derived coding automation and repository control-plane capabilities.",
    dependencies: [
      { plugin: "stack.planning.core", kind: "required" },
      { plugin: "stack.integration.github", kind: "required" },
    ],
    provides: ["coding.automation", "repository.control-plane"],
  },
  {
    id: "stack.trading.market-data",
    version: "0.1.0",
    description: "Trading market-data capability.",
    dependencies: [{ plugin: "stack.core.composition", kind: "required" }],
    provides: ["trading.market-data"],
  },
  {
    id: "stack.trading.research",
    version: "0.1.0",
    description: "Trading research, indicators, strategies and analysis.",
    dependencies: [{ plugin: "stack.trading.market-data", kind: "required" }],
    provides: ["trading.research"],
  },
  {
    id: "stack.trading.backtest",
    version: "0.1.0",
    description: "Deterministic backtesting and evaluation.",
    dependencies: [{ plugin: "stack.trading.research", kind: "required" }],
    provides: ["trading.backtest"],
  },
  {
    id: "stack.trading.optimizer",
    version: "0.1.0",
    description: "Train/test parameter search and strategy evaluation.",
    dependencies: [{ plugin: "stack.trading.backtest", kind: "required" }],
    provides: ["trading.optimizer"],
  },
  {
    id: "stack.skyblock.hypixel",
    version: "0.1.0",
    description: "Hypixel API and SkyBlock data integration.",
    provides: ["skyblock.hypixel"],
  },
  {
    id: "stack.skyblock.domain",
    version: "0.1.0",
    description: "SkyBlock deterministic domain model and calculations.",
    dependencies: [{ plugin: "stack.skyblock.hypixel", kind: "required" }],
    provides: ["skyblock.domain"],
  },
  {
    id: "stack.skyblock.objectives",
    version: "0.1.0",
    description: "SkyBlock objectives and deterministic planning state.",
    dependencies: [
      { plugin: "stack.skyblock.domain", kind: "required" },
      { plugin: "stack.planning.core", kind: "required" },
    ],
    provides: ["skyblock.objectives"],
  },
];

export const packs: readonly PackDefinition[] = [
  {
    id: "stack.workspace",
    version: "0.1.0",
    description: "Canonical shared workspace surfaces.",
    plugins: [
      "stack.core.composition",
      "stack.workspace.tabs",
      "stack.workspace.sidebar",
      "stack.ui.icons",
      "stack.ui.icons.vscode",
      "stack.ui.skin.deepseek",
      "stack.ui.skin.claude",
      "stack.ui.skin.codex",
    ],
  },
  {
    id: "stack.planning",
    version: "0.1.0",
    description: "Shared planning and external project integration.",
    plugins: [
      "stack.planning.core",
      "stack.integration.github",
      "stack.integration.github-projects",
      "stack.integration.trello",
    ],
  },
  {
    id: "stack.coding",
    version: "0.1.0",
    description: "Software engineering and repository control-plane capabilities.",
    plugins: ["stack.coding.darkfactory"],
  },
  {
    id: "stack.trading",
    version: "0.1.0",
    description: "Quantitative research and trading analysis capabilities.",
    plugins: [
      "stack.trading.market-data",
      "stack.trading.research",
      "stack.trading.backtest",
      "stack.trading.optimizer",
    ],
  },
  {
    id: "stack.skyblock",
    version: "0.1.0",
    description: "SkyBlock domain and planning capabilities.",
    plugins: [
      "stack.skyblock.hypixel",
      "stack.skyblock.domain",
      "stack.skyblock.objectives",
    ],
  },
];

export const profiles: readonly ProfileDefinition[] = [
  {
    id: "default",
    version: "0.1.0",
    description: "General-purpose integrated DSH Stack environment.",
    packs: ["stack.workspace", "stack.planning"],
  },
  {
    id: "coding",
    version: "0.1.0",
    description: "Software-engineering focused DSH Stack environment.",
    packs: ["stack.workspace", "stack.planning", "stack.coding"],
  },
  {
    id: "trading",
    version: "0.1.0",
    description: "Quantitative trading and research environment.",
    packs: ["stack.workspace", "stack.trading"],
  },
  {
    id: "skyblock",
    version: "0.1.0",
    description: "Hypixel SkyBlock domain and planning environment.",
    packs: ["stack.workspace", "stack.planning", "stack.skyblock"],
  },
];
