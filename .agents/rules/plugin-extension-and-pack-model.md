---
date: 2026-08-27
status: active
---

# Plugin, extension, and pack model

The composition tree recomposes around three distinct roles, not one:

- **Plugin** = a pure abstraction/extension-point layer. It defines the contract, registry, or mount point that concrete implementations plug into. A plugin does not itself bundle multiple unrelated concrete feature implementations.
- **Extension** = one individual concrete implementation of a specific feature, plugged into a plugin's abstraction layer. Every actual individual implementation is its own extension — e.g. each skin (Claude, Codex, DeepSeek) is an extension of the skin abstraction; each icon set is an extension of the icon abstraction; each agent preset is an extension of the agent-preset abstraction; each per-tool terminal harness or per-language LSP server is its own extension, not bundled inside one umbrella plugin.
- **Pack** = one per domain: a distribution/composition bundle over a domain's plugins and extensions.

Target end state: one plugin per abstraction, one extension per feature, one pack per domain. When a plugin's canonical package registers several distinct, independently-meaningful capabilities in one `apply()` (multiple unrelated settings sections, multiple unrelated command families, multiple unrelated bundled features), that is a bundling smell — the individual features should split out into separate extensions, leaving the plugin as the abstraction/registry they plug into.
