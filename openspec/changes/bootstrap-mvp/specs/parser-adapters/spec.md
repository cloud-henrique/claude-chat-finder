## Purpose

Defines a pluggable interface for turning raw chat-history files from different AI coding tools into one normalized session/message model, so indexing, search, and the TUI never need to know the source file format.

## ADDED Requirements

### Requirement: Adapter interface contract
The system SHALL define a common adapter interface that any chat-history source implements to produce a normalized list of sessions, each with a project path, session id, timestamps, and an ordered list of messages (role, content, tool calls).

#### Scenario: Adapter returns normalized sessions
- **WHEN** an adapter is asked to enumerate sessions for a given root directory
- **THEN** it SHALL return sessions conforming to the normalized session/message model regardless of the source file format

### Requirement: Claude Code adapter parses JSONL sessions
The system SHALL ship a Claude Code adapter that reads session files from `~/.claude/projects/**/*.jsonl` (and the OS-equivalent home directory on Windows), parsing each line as one JSON event and reconstructing the ordered conversation.

#### Scenario: Parsing a valid session file
- **WHEN** the Claude Code adapter reads a `.jsonl` session file
- **THEN** it SHALL produce one normalized session containing the project's real working directory (read from each event's `cwd` field, not decoded from the folder name), the session id, and all user/assistant messages in order

### Requirement: Malformed session files do not stop indexing
The system SHALL skip a session file it cannot parse (corrupt JSON, unexpected schema) without aborting the overall indexing run.

#### Scenario: One corrupt file among many
- **WHEN** the adapter encounters a line or file that fails to parse
- **THEN** it SHALL log a warning, skip that file, and continue processing the remaining session files

### Requirement: Multiple adapters can be registered
The system SHALL support registering more than one adapter at a time, each contributing sessions from its own source, without adapters needing to know about each other.

#### Scenario: Only one adapter configured
- **WHEN** only the Claude Code adapter is registered (the MVP default)
- **THEN** the system SHALL index and search exclusively Claude Code sessions without requiring changes to the search or TUI capabilities
