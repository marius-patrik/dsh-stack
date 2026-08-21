# Session 42: Resizable Settings Window

## Request
**User Prompt:**
> "make the settings window resizable"

## Tasks
1. **Window Size State & LocalStorage Persistence**:
   - Add `windowSizeState` (`w`, `h`) with `localStorage` keys `dsh_settings_window_width` and `dsh_settings_window_height`.
   - Set bounds: `minWidth: 540px`, `maxWidth: calc(100vw - 32px)`, `minHeight: 400px`, `maxHeight: calc(100vh - 32px)`.
2. **Interactive Window Resize Handles**:
   - Bottom-Right corner resize handle with diagonal grip glyph (`cursor: nwse-resize`).
   - Right-edge resize handle (`cursor: ew-resize`).
   - Bottom-edge resize handle (`cursor: ns-resize`).
   - Smooth 60fps pointer dragging with `user-select: none` during resize.
3. **Responsive Content Reflow**:
   - Settings content and nav reflow seamlessly to any user-dragged dimensions.
