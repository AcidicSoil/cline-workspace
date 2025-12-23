
### 1) Install the Genkit extension into Gemini CLI

    gemini extensions install https://github.com/gemini-cli-extensions/genkit

This installs a Gemini CLI extension that bundles Genkit-specific context plus MCP tools (including flow discovery, execution, and trace inspection). [GitHub+1](https://github.com/gemini-cli-extensions/genkit)

Gemini CLI loads installed extensions automatically from the extensions directory on startup. [Google Gemini](https://google-gemini.github.io/gemini-cli/docs/extensions/)

* * *

### 2) Run your Genkit app in “dev” so flows + traces exist to interact with

For a TypeScript Genkit app, start the Genkit Developer UI (and your app) from the project root:

    genkit start -- npx tsx --watch src/index.ts

This starts the Developer UI (default `http://localhost:4000`) and runs the code that defines/imports your flows. [Firebase](https://firebase.google.com/docs/genkit/get-started)

* * *

### 3) Launch Gemini CLI inside the Genkit project and use it to complete tasks via flows

    cd /path/to/your/genkit-project
    gemini

With the Genkit extension installed, Gemini CLI has:

* Genkit-aware guidance (patterns, best practices, docs lookup). [Google Developers Blog](https://developers.googleblog.com/announcing-the-genkit-extension-for-gemini-cli/)

* MCP tools to **list flows**, **run flows**, and **inspect traces** (`list_flows`, `run_flow`, `get_trace`, plus doc helpers). [Google Developers Blog](https://developers.googleblog.com/announcing-the-genkit-extension-for-gemini-cli/)

* * *

Practical “task completion” loop (how you actually use it)
----------------------------------------------------------

Convert “task” → “flow” → “run” → “trace” → “fix” → “rerun”.

### A) Create/modify the task as a Genkit flow

In the Gemini CLI prompt:

    > Write a flow that tests an input string for profanity.

(Example from the extension repo.) [GitHub](https://github.com/gemini-cli-extensions/genkit)

### B) Execute the task repeatedly using the flow runner tool

    > List the flows in this project, then run profanityCheckerFlow with input "some test string".

The extension exposes `list_flows` and `run_flow` for this purpose. [Google Developers Blog](https://developers.googleblog.com/announcing-the-genkit-extension-for-gemini-cli/)

### C) Debug failures using traces (closed-loop)

    > Get the trace for the last run of profanityCheckerFlow and explain where the output went wrong. Then fix the flow and rerun it.

The extension exposes `get_trace` for step-by-step OpenTelemetry trace analysis. [Google Developers Blog](https://developers.googleblog.com/announcing-the-genkit-extension-for-gemini-cli/)

### D) Add evaluation so “task completion” becomes measurable

    > Write an evaluator with a sample dataset for my profanityCheckerFlow.

(Example from the extension repo.) [GitHub](https://github.com/gemini-cli-extensions/genkit)

---
