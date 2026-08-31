## Purpose

Gives users an interactive terminal interface to browse projects and sessions, search live, and preview a chat before acting on it.

## ADDED Requirements

### Requirement: Live search-as-you-type
The TUI SHALL update the result list as the user types a query, without requiring an explicit submit action.

#### Scenario: Typing updates results
- **WHEN** the user types or edits the search query
- **THEN** the visible result list SHALL update to reflect the current query within a perceptible-as-instant delay

### Requirement: Keyboard-driven navigation
The TUI SHALL let the user navigate the result list and open a preview using only the keyboard.

#### Scenario: Navigating results
- **WHEN** the user presses the up/down navigation keys
- **THEN** the selection SHALL move between results without requiring a mouse

### Requirement: Markdown preview pane
The TUI SHALL render the selected chat's messages as formatted Markdown in a preview pane, including code blocks.

#### Scenario: Previewing a selected chat
- **WHEN** the user selects a session from the result list
- **THEN** the TUI SHALL display that session's messages, rendered as Markdown, in a preview pane

### Requirement: Cross-platform terminal compatibility
The TUI SHALL render correctly in standard terminal emulators on macOS, Linux, and Windows (including Windows Terminal).

#### Scenario: Running on each supported OS
- **WHEN** the tool is launched in a standard terminal on macOS, Linux, or Windows
- **THEN** the TUI SHALL render and accept keyboard input without garbled output or crashes
