## Purpose

Maintains a local, offline full-text index built from parsed sessions so searches return instantly without re-scanning every chat file on each run.

## ADDED Requirements

### Requirement: Local index storage
The system SHALL persist the search index in a local SQLite database file under the user's OS-appropriate config/cache directory, and SHALL NOT transmit indexed content over the network.

#### Scenario: First run builds the index
- **WHEN** the tool runs for the first time and no index exists
- **THEN** it SHALL create the SQLite database and populate it with all sessions discovered by the registered adapters

### Requirement: Incremental re-indexing
The system SHALL re-index only session files that are new or whose modification time has changed since the last index build, leaving unchanged sessions untouched.

#### Scenario: Subsequent run with no new chats
- **WHEN** the tool runs again and no session file has changed since the last index build
- **THEN** it SHALL skip re-parsing every unchanged file and complete indexing in effectively constant time relative to history size

### Requirement: Deleted or moved session files are pruned from the index
The system SHALL remove index entries for session files that no longer exist on disk.

#### Scenario: A session file is deleted
- **WHEN** a previously indexed session file is missing during a re-index pass
- **THEN** the system SHALL remove that session's entries from the index so it no longer appears in search results
