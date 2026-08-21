# Session 63 Request: Lucide Icon Pack Placed Directly Below Icon Engine

## User Directives (Verbatim)
`/plan lucide should be below icon engine`

## Architectural Directory Structure
```
plugins/
  ux/
    icon-engine/                (Universal Icon Resolution Pipeline & Native App Sips Loader)
      packs/
        lucide-animated/        (Authentic 24x24 Animated Lucide SVGs Icon Pack)
    theme-studio/               (VS Code / TextMate Themes Engine & Open VSX Store)
    voice-synthesis/            (Web Speech API & Local Whisper Neural Speech Engine)
    terminal-client/            (Standalone Terminal User Interface Client)
```

`lucide-animated` is organized under `plugins/ux/icon-engine/packs/lucide-animated/`, declares `inject: ['icons']`, and registers its animated SVGs into `ctx.icons`.
