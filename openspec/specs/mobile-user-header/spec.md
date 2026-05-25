## Purpose

This specification defines the behavior of the top header component on mobile devices, ensuring username visibility and logout accessibility for improved user identification and navigation.

## Requirements

### Requirement: Username visibility on mobile
The system SHALL display the username in the top header on all mobile devices (screens <= 768px width) to enable users to identify themselves without additional navigation.

#### Scenario: Username displays on mobile portrait
- **WHEN** user views the application on a mobile device in portrait mode (320-540px width)
- **THEN** the username is visible in the top header next to the user avatar with text truncation (ellipsis) if necessary

#### Scenario: Username displays on mobile landscape
- **WHEN** user views the application on a mobile device in landscape mode (540-768px width)
- **THEN** the username is visible in the top header next to the user avatar without truncation if space permits

#### Scenario: Username truncates gracefully on very small screens
- **WHEN** user views the application on a device smaller than 320px width
- **THEN** the username is truncated with ellipsis (three dots) when it exceeds the maximum width of 140px

### Requirement: User actions remain accessible on mobile
The system SHALL ensure that both the user avatar and logout button remain accessible on mobile devices in the top header.

#### Scenario: User avatar visible on mobile
- **WHEN** user is authenticated on a mobile device
- **THEN** the user avatar (either photo or fallback icon) is visible in the top header

#### Scenario: Logout button accessible on mobile header
- **WHEN** user is viewing the top header on a mobile device
- **THEN** the logout button (box-arrow-right icon) is visible and clickable in the user-actions section

#### Scenario: User can logout from top header on mobile
- **WHEN** user clicks the logout button in the top header on a mobile device
- **THEN** the user is logged out and redirected to the login page

### Requirement: Responsive layout on mobile
The system SHALL maintain proper spacing and layout of the top header on mobile devices without overflow or layout shifts.

#### Scenario: Header layout responsive to screen size
- **WHEN** user resizes browser or rotates device on mobile
- **THEN** the header layout adapts appropriately with adjusted padding and gaps (1rem on desktop, 0.5rem on mobile)

#### Scenario: No layout overflow on mobile
- **WHEN** user has a long username (e.g., 30+ characters) on a mobile device
- **THEN** the username is truncated with ellipsis and does not cause horizontal scroll or layout overflow

### Requirement: Consistent styling on mobile
The system SHALL apply consistent styling to user information on mobile that matches the desktop experience where applicable.

#### Scenario: User info styling matches desktop on mobile
- **WHEN** user views the top header on a mobile device
- **THEN** the user-info background, border-radius (999px pill shape), and text styling match the desktop design
