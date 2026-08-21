# Session 45: Assistant Bubbles (Blurple), User Bubbles (OLED/Main), Settings Border, Input Bubble & Universal Animated Lucide Icons

## Request
**User Prompt:**
> "assistant messages should be in bubbless, blurple for assistant oled/main for user, border settings doesnt work - setttings window should have border input bar displays toolbar input bar itself bubbless .. lucide-animated icons sorry and replace ALL barealy any changed"

## Tasks
1. **Assistant Message Bubbles (Blurple)**:
   - Wrap and style assistant responses in distinct, rounded bubbles (`border-radius: 20px`, padding `14px 18px`).
   - Theme color: Blurple tint (`rgba(99, 102, 241, 0.14)` surface, `rgba(99, 102, 241, 0.35)` border).
   - In OLED mode: Deep blurple dark surface (`rgba(99, 102, 241, 0.10)`, `#6366f1` accent).
2. **User Message Bubbles (OLED / Main)**:
   - User message bubble: OLED surface (`#0a0a0a` / `#0f0f0f` with `#222222` border in OLED; `var(--dsw-alias-surface-l1)` in main theme).
   - Rounded `20px` corners, aligned right.
3. **Settings Window Border**:
   - Give `.dsh-tw-panel` a clear, prominent, beautiful border (`1.5px solid rgba(255, 255, 255, 0.22)` and in OLED `1.5px solid #333333` with dual-layer glow shadow) so the settings window border is crisp and unmistakably visible.
4. **Input Bar Bubble with Integrated Toolbar**:
   - The entire composer input card (`.card`, `.inputArea`) is styled as a unified capsule bubble with smooth `22px` rounded corners, containing the textarea and toolbar controls seamlessly.
5. **Universal Animated Lucide Icons Everywhere**:
   - Upgrade every single icon in the sidebar, header, tabs, composer, toolbar, model picker, settings, breadcrumbs, actions, and tree rows to authentic Lucide React 24x24 vector icons with `.dsh-icon-animated` and smooth hover micro-animations.
