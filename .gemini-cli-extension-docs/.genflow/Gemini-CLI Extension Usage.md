
Install and enable `gemini-flow` in Gemini CLI
----------------------------------------------

    # Install the extension from GitHub (must be full URL)
    gemini extensions install https://github.com/clduab11/gemini-flow

    # Enable it
    gemini extensions enable gemini-flow

    # Restart any running gemini CLI sessions (changes apply on restart)

Gemini CLI installs extensions from a GitHub URL or local path via `gemini extensions install ...` and manages them with `gemini extensions enable|disable|list|update`. [Gemini CLI+2blog.google+2](https://geminicli.com/docs/extensions/)
`gemini-flow` explicitly notes the full-URL requirement (no `github:user/repo` shorthand). [GitHub](https://github.com/clduab11/gemini-flow)

Verify it’s active inside the CLI
---------------------------------

    gemini
    /extensions
    /mcp list

`/extensions` lists active extensions in the current session. `/mcp list` lists configured MCP servers/tools. [Gemini CLI](https://geminicli.com/docs/cli/commands/)

Use gemini-flow to run/complete tasks (core commands)
-----------------------------------------------------

Once enabled, `gemini-flow` exposes these command groups (as shown in its README). [GitHub](https://github.com/clduab11/gemini-flow)

### 1) “Hive mind” (single objective → coordinated execution)

    gemini hive-mind spawn "Build AI application"
    gemini hive-mind status

### 2) Swarm (spin up multiple workers for an objective)

    gemini swarm init --nodes 10
    gemini swarm spawn --objective "Research task"

### 3) Agents (spawn and manage specialized agents)

    gemini agent spawn researcher --count 3
    gemini agent list

### 4) Task routing (create work items and assign them to agents)

    gemini task create "Feature X" --priority high
    gemini task assign TASK_ID --agent AGENT_ID

### 5) Memory (store/query durable context)

    gemini memory store "key" "value" --namespace project
    gemini memory query "pattern"

What you get when you install the extension
-------------------------------------------

`gemini-flow` bundles MCP servers + custom commands + auto-loaded context files (for the model to follow). It lists 9 pre-configured MCP servers and 7 custom command groups (including `hive-mind`, `swarm`, `agent`, `memory`, `task`, etc.). [GitHub](https://github.com/clduab11/gemini-flow)

---
