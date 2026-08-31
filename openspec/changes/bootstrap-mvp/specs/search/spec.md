## Purpose

Provides a full-text query engine over the indexed chat history, letting users narrow matches with case sensitivity, whole-word, and regex modes.

## ADDED Requirements

### Requirement: Free-text search across chat content
The system SHALL search message content across all indexed sessions and return matching sessions ranked by relevance.

#### Scenario: Searching for a term present in one chat
- **WHEN** the user searches for a term that appears in exactly one session
- **THEN** the system SHALL return that session with the matching message(s) highlighted

### Requirement: Case sensitivity toggle
The system SHALL let the user choose between case-sensitive and case-insensitive matching, defaulting to case-insensitive.

#### Scenario: Case-sensitive search excludes different casing
- **WHEN** case-sensitive mode is enabled and the user searches for "Bug" while a chat only contains "bug"
- **THEN** that chat SHALL NOT appear in the results

### Requirement: Whole-word matching
The system SHALL let the user restrict matches to whole-word occurrences of the search term.

#### Scenario: Whole-word mode excludes substring matches
- **WHEN** whole-word mode is enabled and the user searches for "log"
- **THEN** a chat that only contains "login" or "catalog" SHALL NOT match, while a chat containing the standalone word "log" SHALL match

### Requirement: Regex search mode
The system SHALL let the user search using a regular expression instead of a literal term, and SHALL reject invalid regex patterns with a clear error instead of crashing.

#### Scenario: Valid regex returns matches
- **WHEN** the user enables regex mode and enters a syntactically valid pattern
- **THEN** the system SHALL return all sessions whose content matches the pattern

#### Scenario: Invalid regex is rejected gracefully
- **WHEN** the user enables regex mode and enters a syntactically invalid pattern
- **THEN** the system SHALL display an error message and SHALL NOT crash or hang
