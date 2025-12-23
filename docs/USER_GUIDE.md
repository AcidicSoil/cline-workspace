# User Guide

This guide explains how to configure and use the Gemini Flow Pack tools within your project.

## 1. Setup

Ensure you have the dependencies installed and the project built:

```bash
npm install
npm run build
```

## 2. Managing Tasks (`tasks.json`)

The system relies on a `tasks.json` file in the project root to define your workflow dependency graph.

### Schema

```json
{
  "tasks": [
    {
      "id": "1",
      "title": "Initial Setup",
      "status": "done",
      "priority": "high",
      "dependencies": []
    },
    {
      "id": "2",
      "title": "Develop Feature X",
      "description": "Implementation details...",
      "status": "pending",
      "dependencies": ["1"]
    }
  ]
}
```

### Validation
The system will automatically reject:
-   **Circular Dependencies**: e.g., Task A depends on Task B, which depends on Task A.
-   **Missing Dependencies**: Referring to an ID that does not exist.
-   **Duplicate IDs**: Multiple tasks with the same ID.

## 3. Using the CLI

The project includes a CLI extension wrapper that allows you to trigger workflows manually.

### List Workflows
View all available workflows defined in the manifest.

```bash
# If running via node directly
node dist/gemini_ext/commands.js list

# Expected Output:
# [
#   { "id": "pr-review", "name": "PR Review", ... },
#   { "id": "lint-sweep", "name": "Lint Sweep", ... }
# ]
```

### Run a Workflow
Execute a specific workflow by ID.

```bash
node dist/gemini_ext/commands.js run <workflow_id>

# Example:
node dist/gemini_ext/commands.js run lint-sweep
```

## 4. MCP Tools Reference

If you are connecting this server to an MCP Client (like Gemini or Claude), the following tools are available:

### `list_workflows`
*   **Description**: Lists all registered workflows.
*   **Inputs**: None.

### `run_workflow`
*   **Description**: Runs a workflow script.
*   **Inputs**:
    *   `workflow_id` (string, required): The ID of the workflow to run.
    *   `inputs` (object, optional): Key-value pairs of input arguments for the workflow.
    *   `mode` (string, optional): 'headless' or 'interactive'.
    *   `artifactDir` (string, optional): Directory to check for output files.

### `install_pack`
*   **Description**: Installs workflow configuration files into a target directory.
*   **Inputs**:
    *   `targetPath` (string, required): Absolute path to the destination project root.
    *   `selection` (array<string>, optional): Specific filenames to install. If omitted, installs all.
    *   `overwritePolicy` (enum, optional):
        *   `skip`: (Default) Do not overwrite existing files.
        *   `overwrite`: Replace existing files.
        *   `abort`: Fail if any file exists.
