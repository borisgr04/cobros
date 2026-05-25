## Context

Currently, the top-header component displays user information (username and avatar) but hides the username on mobile devices via a responsive CSS rule (`display: none` at max-width: 576px). The sidebar with user/logout is completely hidden on mobile (max-width: 768px), and the only way to access user info and logout on mobile is through the "Usuario" button in the bottom navigation, which shows a slide-up panel menu.

The issue is that users cannot see their username at a glance on mobile, requiring an extra click to access the user menu.

## Goals / Non-Goals

**Goals:**
- Make the username visible on mobile devices to improve user identification
- Keep the responsive design clean and avoid layout overflow
- Maintain accessibility and touch-friendly interface sizing
- Preserve existing desktop behavior

**Non-Goals:**
- Redesign the entire mobile navigation structure
- Add new navigation items to the header
- Change the bottom navigation menu visibility logic

## Decisions

**Decision 1: Adjust the responsive breakpoint for username visibility**
- **Choice**: Keep the username visible on all mobile devices (remove the `display: none` rule or adjust the breakpoint)
- **Rationale**: The username text already includes `text-overflow: ellipsis` and `max-width: 140px`, making it truncation-safe on smaller screens. This is simpler than redesigning the header layout.
- **Alternative**: Hide the avatar instead of the username (rejected - avatar is important for visual identification)
- **Alternative**: Add a separate mobile header for user info (rejected - overcomplicates the component)

**Decision 2: Keep the current spacing and avoid layout reflow**
- **Choice**: Only remove the `display: none` CSS rule; the existing flex layout, padding, and spacing are already mobile-responsive
- **Rationale**: The `user-actions` flexbox with `gap: 1rem` already adapts to mobile screens via the `@media (max-width: 768px)` rule that reduces gap to `0.5rem`
- **Alternative**: Add a dedicated mobile user section (rejected - adds complexity and duplication)

## Risks / Trade-offs

**[Risk] Username might truncate on very small screens (< 320px)**
→ **Mitigation**: `max-width: 140px` with `text-overflow: ellipsis` handles this. Test on smallest supported devices.

**[Risk] Header might feel crowded on mobile**
→ **Mitigation**: The header already uses responsive font sizes and padding adjustments via the existing media query. Monitor visual balance during testing.

**[Risk] User info is duplicated between top-header and bottom-nav user panel**
→ **Mitigation**: This is intentional - the top-header provides quick identification, while the bottom-nav panel provides quick access to logout.

## Migration Plan

1. Update `top-header.component.scss`: Remove or adjust the `@media (max-width: 576px)` rule that hides `.user-name`
2. Test on mobile viewports (< 768px) to ensure:
   - Username displays without overflow
   - Layout doesn't shift unexpectedly
   - Touch targets remain usable (> 44px minimum)
3. Verify on bottom navigation: User panel still works correctly
4. No breaking changes - deployment can be direct

