# Persistent agent kernel boundary

The `@dsh-stack/agent-kernel` plugin owns durable agent identity, an append-only source-event worldline, and the generic environment/event/capability registry. Its Cordis mount is lifecycle integration, not the authority of the durable identity.

Do not place durable identity in sessions, agent presets, personas, model providers, or tools. Do not add another source-event/worldline owner. External environments integrate through the kernel's semantic contracts, without making the kernel depend on any specific environment. Keep the kernel part of the same native `@dsh-stack/stack` composition across Web, Headless and TUI.
