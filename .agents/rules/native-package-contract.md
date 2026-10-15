# Native package contract

Every publishable implementation under `packages/stack/` has a unique
`@dsh-stack/*` package name, independent version, ESM exports, explicit
publishable files and required dependencies. Plugin packages have a unique
`stack.id`, and every native bundle declares its `dsh.bundle.patch`
contract. Each owning package supplies meaningful build/typecheck/test/verify
checks appropriate to its behavior.

Bundle composition is metadata; only plugin packages own runtime behavior.
No generated build output is checked into source control.
