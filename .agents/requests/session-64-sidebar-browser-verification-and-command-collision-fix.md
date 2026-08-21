# Session 64 Request — Sidebar Browser Verification & Command Collision Fix

## User Directive
`"sidebar still broken test via browser"`

## Requirements
1. Run live Google Chrome CDP end-to-end testing against `http://localhost:3080`.
2. Inspect and fix any issues in the left sidebar tree, dropdown menus, and expand/collapse rail transitions.
3. Fix command registration collisions between `dsh-actions` and native harness commands (`goal`, `plan`).
4. Ensure all 84 package check-plugin suites pass 100% green.
