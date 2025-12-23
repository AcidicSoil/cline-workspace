# Gemini Flow Pack Workspace

This repository contains the core infrastructure for the Gemini Flow Pack, enabling advanced task management, AI-driven workflow execution, and standardized gating policies.

## Documentation

-   **[Architecture Overview](docs/ARCHITECTURE.md)**: Deep dive into the system components, including the Task Bridge, MCP Server, and Gating logic.
-   **[User Guide](docs/USER_GUIDE.md)**: Instructions on how to configure `tasks.json` and use the CLI tools.

## Key Features

-   **Task Graph Management**: Detect circles, validate schemas, and sync with external systems.
-   **Model Context Protocol (MCP)**: Full MCP server implementation exposing tools for workflow orchestration.
-   **AI Verdict Gating**: Strict parsing of AI model outputs to enforce `PASS`/`BLOCK` policies.
-   **CLI Extension**: Wrappers for easy integration with the Gemini CLI.

## Quick Start

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Build**:
    ```bash
    npm run build
    ```
    *(Note: Ensure you have a build script defined in package.json, e.g., `tsc`)*

3.  **Run Tests**:
    ```bash
    npm test
    ```