# Architecture notes

## Source ownership

`src/packages/` is the canonical flat implementation layer; `publish/plugins/`, `publish/extensions/`, and `publish/packs/` compose those implementations without duplicating them. Each package directory containing a `package.json` is independently addressable. No implementation is duplicated between pack roots and child plugins/extensions.

## Runtime ownership

DeepSeek Harness owns Cordis runtime composition, session lifecycle, native agent presets, filesystem capabilities, credentials, providers, and other upstream seams. Stack consumes those contracts and extends them through plugins.

## Composition

Required dependencies form the hard graph. Optional dependencies are feature accelerators. Packs declare their component plugin graph explicitly. Runtime services are created only by their owning plugin; packs contain metadata/composition and never manufacture fake initialized services.

## UI

The Stack shell uses native DSH slots. State lives in feature services or dedicated support libraries, not in duplicated React/local-storage copies. External integrations are isolated plugins. Brand skins and icon providers are isolated plugins.

## Profiles

Profiles select a graph of plugins and packs. They do not fork implementations. The active profile is persisted as user preference and changes composition through the supported runtime mechanism.

## Verification

The verifier checks package contract, unique package/plugin IDs, namespace rules, tracked generated-output absence, duplicate source bodies, unfinished markers, unsafe casts, broken workspace links, and truthful pack/plugin metadata. CI executes typecheck, build, verify, and tests on every PR.
