## Why

Mobile users cannot see their username or access the logout option without navigating to a hidden menu. This reduces visibility of user identity and makes logout functionality less discoverable on mobile devices. The username should be immediately visible to users on all screen sizes for better UX.

## What Changes

- Display username in the top header on mobile devices (currently hidden with `display: none`)
- Ensure user avatar and logout button remain accessible and visible on mobile
- Adjust responsive breakpoints to improve mobile user visibility

## Capabilities

### New Capabilities
- `mobile-user-header`: Display username and user information visibly in the top header on mobile devices, making user identity immediately recognizable.

### Modified Capabilities

## Impact

- **Frontend Components**: `top-header` component styling (SCSS responsive rules)
- **Layout**: Mobile viewport behavior (max-width: 576px and below)
- **User Experience**: Improved mobile navigation and user identification
