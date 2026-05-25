## Why

The user query/consultation feature (Usuarios menu) is currently only accessible from the desktop sidebar navigation. Mobile users have no direct access to this feature from the bottom navigation menu, creating an inconsistent experience between device types and limiting functionality for mobile-only users.

## What Changes

- Add the "Usuarios" menu item to the bottom navigation component (mobile menu)
- Ensure the mobile menu includes the same navigation items as the desktop sidebar
- Both desktop sidebar and mobile bottom navigation will provide complete access to all application features including user query/consultation

## Capabilities

### New Capabilities

- `mobile-user-menu-access`: Mobile users can navigate to the user query/consultation feature from the bottom navigation menu, achieving feature parity with desktop users

### Modified Capabilities

- `bottom-navigation`: The bottom navigation component will include the user query menu item alongside existing menu items

## Impact

- **Frontend Components**: 
  - `cobros-iu/src/app/shared/components/bottom-navigation/` - add Usuarios menu item
  - `cobros-iu/src/app/shared/components/sidebar-navigation/` - verify consistency
- **User Experience**: Mobile users gain access to Usuarios feature
- **No backend changes required**: The feature already exists; only navigation accessibility is being added
