# System Architecture

This document describes the architecture of the Gemini Flow Pack workspace, which serves as a bridge between local task management (`tasks.json`) and external AI orchestration systems (Gemini Flow), utilizing the Model Context Protocol (MCP).

## High-Level Overview

The system is composed of four main subsystems:
1.  **Task Bridge**: Handles the translation and synchronization of task data.
2.  **MCP Server**: Exposes internal functionality as standardized AI tools.
3.  **Gating & Verification**: Standardizes model outputs and enforce quality gates.
4.  **Gemini CLI Extension**: Wraps the MCP server for easy command-line access.

---

## 1. Task Bridge

The Task Bridge is responsible for maintaining the state of tasks and synchronizing them between the local development environment and the external Gemini Flow system.

### Components

-   **Loader (`src/taskbridge/loader.ts`)**
    -   **Purpose**: Reads and validates the local `tasks.json` file.
    -   **Features**:
        -   Strict Schema Validation using Zod.
        -   Cycle Detection: Prevents infinite loops in task dependencies.
        -   Missing Dependency checks.
    -   **Input**: `tasks.json`
    -   **Output**: `TaskGraph` (Internal Object Model)

-   **Importer (`src/taskbridge/importer.ts`)**
    -   **Purpose**: Converts the internal `TaskGraph` into the format required by Gemini Flow.
    -   **Features**:
        -   **Stable ID Generation**: Uses SHA-256 hashing of task content to ensure that re-running imports for the same task results in the same ID, preserving history.
        -   **Dependency Mapping**: Translates internal IDs to Stable IDs for prerequisites.
    -   **Input**: `TaskGraph`
    -   **Output**: `GeminiTask[]`, `IDMap`

-   **Exporter (`src/taskbridge/exporter.ts`)**
    -   **Purpose**: Reconciles external execution status back to the local context.
    -   **Features**:
        -   Fetches status from `GeminiFlowProvider`.
        -   Maps external statuses (e.g., `completed`, `failed`) to internal statuses (`done`, `blocked`).
        -   Generates a snapshot file.
    -   **Output**: `TaskGraphSnapshot` JSON file.

---

## 2. MCP Server

The **Model Context Protocol (MCP)** Server acts as the primary interface for AI agents to interact with this repository's capabilities.

-   **Location**: `src/mcp/server.ts`
-   **Transport**: Stdio (Standard Input/Output) JSON-RPC.
-   **Tools Exposed**:
    1.  `list_workflows`: Retrieves available workflows from the manifest.
    2.  `run_workflow`: Executes a specific workflow script.
    3.  `install_pack`: Bootstraps workflow configuration files into a target project.

---

## 3. Gating & Verification

This module ensures that outputs from AI models (verdicts) are machine-parseable and reliable.

-   **Location**: `src/gating/verdict.ts`
-   **Key Functions**:
    -   `parseVerdict(output)`: Extracts structured verdicts from raw text.
    -   **Strict Parsing**: Looks for `[VERDICT]...[/VERDICT]` blocks first.
    -   **Fallback**: Attempts to parse "Status:" and "Reasoning:" headers if tags are missing.
    -   **Safety**: Configurable "Fail Closed" logic (defaults to `BLOCK` if unparseable).

---

## 4. Gemini CLI Extension

This layer adapts the MCP server logic into a user-friendly CLI experience for the `gemini` command.

-   **Manifest**: `src/gemini_ext/gemini-extension.json`
-   **Entry Point**: `src/gemini_ext/commands.ts`
-   **Commands**:
    -   `pack list`: Wrapper around the `list_workflows` MCP tool.
    -   `pack run <id>`: Wrapper around the `run_workflow` MCP tool.

### Logic Flow
1.  User runs `gemini pack run pr-review`.
2.  `gemini_ext/commands.ts` is invoked with args `['run', 'pr-review']`.
3.  The script calls `handleRunWorkflow` (from the MCP tools layer).
4.  `handleRunWorkflow` looks up the workflow, spawns the underlying script, captures output, parses the verdict, and returns JSON.
5.  The CLI script formats this JSON to stdout.
