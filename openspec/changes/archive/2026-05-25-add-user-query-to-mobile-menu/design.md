## Context

The Cobros application has a responsive UI with two navigation components:
- **Desktop/Tablet**: Sidebar navigation (`sidebar-navigation.component`) with collapsible state
- **Mobile**: Bottom navigation bar (`bottom-navigation.component`) with fixed position

Currently, the sidebar includes the "Usuarios" menu item (for user query/consultation), but the bottom navigation does not. This creates inconsistent feature access between device types.

Both components are located in `cobros-iu/src/app/shared/components/` and use the same Angular routing mechanism.

## Goals / Non-Goals

**Goals:**
- Add the "Usuarios" menu item to the bottom navigation component
- Maintain consistency between desktop and mobile navigation menus
- Preserve existing styling and responsive behavior
- Ensure the menu item properly links to the `/usuarios` route with active state highlighting

**Non-Goals:**
- Modifying the users/query feature itself
- Changing the sidebar structure
- Altering styling or layout of navigation components
- Adding new navigation routes beyond Usuarios

## Decisions

1. **Menu Item Placement**: Add "Usuarios" as the last navigation item in the bottom navigation (before the user profile button)
   - **Rationale**: Maintains visual hierarchy and keeps primary navigation items together, with the user profile as a separate action
   - **Alternative Considered**: Adding as first item - rejected because consistency with sidebar order is preferred

2. **Icon and Label**: Use the same icon (`bi-person-gear`) and label (`Usuarios`) as the desktop sidebar
   - **Rationale**: Ensures visual consistency across platforms and reduces cognitive load for users
   - **Alternative Considered**: Abbreviated label (`Users`) for mobile - rejected due to language consistency

3. **Implementation Approach**: Modify `bottom-navigation.component.ts` to include the Usuarios item in the `navItems` array, matching the sidebar implementation
   - **Rationale**: Both components already use the same `NavItem` interface and routing pattern, making this the most maintainable approach
   - **Alternative Considered**: Creating a shared service for navigation items - rejected as over-engineering for a single item difference

4. **Active State**: Use existing `routerLinkActive` and `routerLinkActiveOptions` directives to highlight the active menu item
   - **Rationale**: Same mechanism already used for other menu items in bottom-nav
   - **Alternative Considered**: Custom active state logic - rejected due to unnecessary complexity

## Risks / Trade-offs

- **Risk**: Menu crowding on very small screens (< 300px width) → **Mitigation**: Current responsive design already handles this with icon-only display; no additional changes needed
- **Risk**: User might need to scroll if too many menu items → **Mitigation**: Bottom navigation is fixed and uses horizontal scrolling if needed; existing design already handles this
- **Trade-off**: Slight increase in bottom navigation complexity → **Benefit**: Achieves full feature parity between mobile and desktop, improving user experience

## Migration Plan

1. No breaking changes - this is purely additive functionality
2. Changes can be deployed immediately without coordination with backend
3. No data migration or user communication required
4. No rollback risk - feature can be easily removed if needed
