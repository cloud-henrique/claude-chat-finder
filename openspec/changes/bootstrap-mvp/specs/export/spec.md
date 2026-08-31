## Purpose

Lets users take a chat out of the tool, either as text they can paste elsewhere or by jumping to the underlying file on disk.

## ADDED Requirements

### Requirement: Copy chat as Markdown
The system SHALL let the user copy the currently selected chat to the system clipboard formatted as Markdown.

#### Scenario: Copying as Markdown
- **WHEN** the user triggers "copy as Markdown" on a selected chat
- **THEN** the full chat SHALL be placed on the system clipboard as Markdown-formatted text

### Requirement: Copy chat as JSON
The system SHALL let the user copy the currently selected chat to the system clipboard as raw JSON.

#### Scenario: Copying as JSON
- **WHEN** the user triggers "copy as JSON" on a selected chat
- **THEN** the session's normalized data SHALL be placed on the system clipboard as valid JSON

### Requirement: Open containing file
The system SHALL let the user open the selected session's underlying file in the OS's default file manager (Finder, Explorer, or equivalent).

#### Scenario: Opening the file location
- **WHEN** the user triggers "open file location" on a selected chat
- **THEN** the OS file manager SHALL open with that session's file visible or selected
