## Purpose

Ensures any developer can install and run the tool on macOS, Linux, or Windows without first installing a language runtime.

## ADDED Requirements

### Requirement: Runtime-free single-file executables
The system SHALL be distributed as a single-file executable per platform (macOS, Linux, Windows) that runs without requiring Node.js, Bun, or any other runtime to be pre-installed.

#### Scenario: Running the downloaded binary
- **WHEN** a user downloads the release binary for their OS and executes it
- **THEN** the tool SHALL launch successfully without any additional runtime installation

### Requirement: Versioned GitHub Releases
The system SHALL publish each release's binaries as downloadable assets on a GitHub Release tagged with a semantic version.

#### Scenario: A new version is released
- **WHEN** a new version is tagged and released
- **THEN** macOS, Linux, and Windows binaries for that version SHALL be attached to the corresponding GitHub Release
