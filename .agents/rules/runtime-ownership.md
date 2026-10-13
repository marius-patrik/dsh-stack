# Runtime and profile ownership

DeepSeek Harness exclusively owns profile templates and user profile data, installation, selection, activation, persistence, and lifecycle. The Stack repository contains no `profiles/` tree, Stack profile selector, profile runtime, launcher, or profile reconciler.

Stack publishes native plugin and bundle packages beneath `packages/`. DSH may install those packages into any compatible user-managed profile using its ordinary commands. CI may create temporary isolated DSH profiles to verify installed behavior; those are fixtures, never Stack-distributed profiles.
