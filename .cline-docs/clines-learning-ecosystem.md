# Cline Learning Ecosystem

## Executive Summary

Cline’s learning ecosystem is centered around the **Learn** hub (`https://cline.bot/learn`), which curates a structured “AI Coding University” path plus a practical **Cline Guides Hub**. The “university” content teaches foundational skills for using Cline effectively—how to prompt clearly, how Cline’s rules and system prompt supply actionable context, and how to understand/select LLMs for real development workflows. The Guides Hub complements this with step-by-step tutorials covering workflows, PR review quality, and running local/offline stacks. The result is a mix of conceptual grounding (prompting, system prompts, LLM evaluation) and applied operational guidance (workflows, local models, review tooling).

---

## Detailed List of All Learning Modules and Contents

### Primary Hub

* **Learn hub (root)**

  * **URL:** [https://cline.bot/learn](https://cline.bot/learn)
  * **What it contains:** Core learning modules (“Core Skills for Building with AI”) plus the **Cline Guides Hub** with practical tutorials and workflows coverage.

---

### Module 1 — Prompting

* **Primary module URL:** [https://cline.bot/learn](https://cline.bot/learn)
* **Sub-links extracted (4):**

  1. **Chapter 1: Prompt Fundamentals**

     * **URL:** [https://cline.bot/blog/prompt-fundamentals](https://cline.bot/blog/prompt-fundamentals)
     * **Content summary:** Explains why vague prompts produce poor outcomes and why Cline’s effectiveness scales with clarity and specificity. Introduces core prompting patterns: **zero-shot** (no examples), **one-shot** (one example to establish a pattern), and **chain-of-thought-style step outlining** for complex, multi-step tasks. Emphasizes choosing the right technique for the situation and iterating prompts to improve relevance and consistency.

  2. **Chapter 2: Cline Rules**

     * **URL:** [https://cline.bot/blog/cline-rules](https://cline.bot/blog/cline-rules)
     * **Content summary:** Defines **Cline Rules** as a way to codify team standards, constraints, and institutional knowledge so the agent can follow them consistently. Distinguishes “rules” (how code should be written/modified) from “requirements” (what should be built). Provides examples of rule categories (security practices, coding style, documentation guidelines, database schema constraints, external integrations). Warns that ambiguous or conflicting rules create unpredictable behavior and advocates specificity and an explicit precedence hierarchy.

  3. **Chapter 3: System Prompt Fundamentals**

     * **URL:** [https://cline.bot/blog/system-prompt](https://cline.bot/blog/system-prompt)
     * **Content summary:** Explains how Cline bridges the “context gap” by assembling a system prompt that gives the model enough information to take meaningful action (rather than producing generic advice). Breaks the system prompt into three “pillars”: **Tools** (what the model can do in your environment), **System Information** (OS/environment context), and **User Preferences** (coding standards and constraints). Shows how these together enable the model to execute changes directly using file operations and commands while respecting user/team preferences.

  4. **Chapter 4: System Prompt Advanced**

     * **URL:** [https://cline.bot/blog/system-prompt-advanced](https://cline.bot/blog/system-prompt-advanced)
     * **Content summary:** Frames Cline tool use like an API surface: the system prompt acts as both “spec” and “manual” for how the model should call tools in sequence. Describes an end-to-end agentic workflow: **agentic exploration** (search/list/read to gather context), **targeted implementation** via diff edits, **verification** via command execution, and **browser-based QA** for functional validation. Emphasizes orchestration—how the system prompt guides the model through a reliable multi-phase loop rather than ad hoc edits.

---

### Module 2 — LLM Fundamentals

* **Primary module URL:** [https://cline.bot/learn](https://cline.bot/learn)
* **Sub-links extracted (4):**

  1. **Chapter 1: LLM Fundamentals**

     * **URL:** [https://cline.bot/blog/llm-fundamentals](https://cline.bot/blog/llm-fundamentals)
     * **Content summary:** Explains that models generate outputs from learned patterns rather than retrieving “stored” code, and that the provider/model choice is a major workflow decision. Highlights architectural tradeoffs (e.g., speed/cost vs deeper reasoning) and that different providers/models have different strengths. Covers foundation-model breadth (beyond code generation) and why capability tradeoffs matter for real Cline sessions. Introduces multi-modality differences and the practical impact (e.g., screenshots for UI bugs). Contrasts non-reasoning vs reasoning models and why reasoning can yield more robust implementations (validation, edge cases, security).

  2. **Chapter 2: LLM Benchmarks**

     * **URL:** [https://cline.bot/blog/llm-benchmarks](https://cline.bot/blog/llm-benchmarks)
     * **Content summary:** Explains benchmarks as standardized comparisons that test different abilities (coding, domain knowledge, tool usage), and warns that a single score is not a universal predictor. Highlights **SWE-Bench** as especially relevant because it uses real OSS issues and maps closely to everyday software engineering tasks (bugs/features/refactors). Notes key limitations such as contamination and why verified variants exist. Describes complementary coding benchmarks plus domain benchmarks (MMLU, GPQA, AIME) to match model strengths to use cases. Emphasizes that tool-use benchmarks matter for MCP-heavy workflows and that hands-on evaluation remains critical.

  3. **Chapter 3: Choosing LLM for Cline**

     * **URL:** [https://cline.bot/blog/choosing-llm-for-cline](https://cline.bot/blog/choosing-llm-for-cline)
     * **Content summary:** Argues that “best model” depends on your real workflow: benchmarks don’t capture the messy interplay of tool use, speed, and context needs. Focuses on inference speed (tokens/sec) and the practical advantage of fast “good enough” models for iterative dev loops. Covers context window requirements for large codebases and long conversations, and frames “context engineering” as a skill. Addresses cost strategy (tiered model usage by task complexity) and highlights Cline’s flexibility to switch models per phase or mode. Reinforces a task-driven selection approach based on constraints and priorities.

  4. **Chapter 4: LLM Providers**

     * **URL:** [https://cline.bot/blog/llm-providers](https://cline.bot/blog/llm-providers)
     * **Content summary:** Presents Cline’s model-agnostic philosophy—avoid lock-in and route requests based on changing needs and offerings. Explains three endpoint categories: **direct to providers**, **aggregators**, and **local models** on your own hardware. Details tradeoffs: direct links for latest models/features, aggregators for simplified multi-provider access and extra tooling, and local models for privacy/offline use with hardware/maintenance costs. Concludes with hybrid routing strategies and configurable switching as a core productivity lever.

---

### Cline Guides Hub

* **Primary hub URL:** [https://cline.bot/learn](https://cline.bot/learn)

* **What it’s positioned to teach:** Setup/configuration, interface navigation, best practices, troubleshooting/optimization, and integration with existing tools/workflows.

* **Sub-links extracted (5):**

  1. **AI Slop Detector — Explain Changes in Cline**

     * **URL:** [https://cline.bot/blog/ai-slop-detector](https://cline.bot/blog/ai-slop-detector)
     * **Content summary:** Defines “AI slop” as code that technically works but harms clarity/intent/maintainability while increasing review load and long-term risk. Introduces **Explain Changes**: inline AI explanations of what changed and why, designed to be context-aware, specific, interactive, and actionable so reviewers can “trust but verify.”

  2. **Which local models actually work with Cline? AMD tested them all**

     * **URL:** [https://cline.bot/blog/local-models-amd](https://cline.bot/blog/local-models-amd)
     * **Content summary:** Reports AMD tested 20+ local models and found only a handful reliably work for coding; many smaller models fail or produce broken outputs. Explains practical setup considerations (RAM vs VRAM; GGUF vs MLX formats). Summarizes quantization tradeoffs and claims AMD testing supports 4-bit quantization as “production-ready” for coding tasks. Provides a RAM-tier guide (32GB/64GB/128GB+) and configuration steps for LM Studio and Cline (context length, compact prompts, server setup).

  3. **How I stopped repeating myself to Cline**

     * **URL:** [https://cline.bot/blog/how-i-stopped-repeating-myself-to-cline](https://cline.bot/blog/how-i-stopped-repeating-myself-to-cline)
     * **Content summary:** Advocates writing repeatable procedures as markdown workflow files invoked via slash commands; workflows become a structured to-do sequence executed with verification. Gives examples like `/weekly-dashboard.md` and `/pr-review.md` to turn multi-step, repeat tasks into one command. Describes how to build workflows (including a “workflow for building workflows”) and where workflow files live for project-specific vs global reuse.

  4. **Stop Adding Rules When You Need Workflows**

     * **URL:** [https://cline.bot/blog/stop-adding-rules-when-you-need-workflows](https://cline.bot/blog/stop-adding-rules-when-you-need-workflows)
     * **Content summary:** Defines workflows as on-demand automations injected into a single message and executed once, vs clinerules as persistent behavioral constraints appended to the system prompt. Notes the token-cost implication: workflows consume tokens only when invoked; clinerules cost tokens every message. Provides a decision framework and concrete workflow examples (PR review, deployment), plus where workflows are stored and how to create/invoke them.

  5. **Cline + LM Studio: the local coding stack with Qwen3 Coder 30B**

     * **URL:** [https://cline.bot/blog/local-models](https://cline.bot/blog/local-models)
     * **Content summary:** Shows how to run Cline fully offline: no API costs, no data leaving the machine, and no internet dependency. Describes the stack (LM Studio runtime + Qwen3 Coder 30B + Cline orchestration) and frames local models as crossing a usability threshold for real coding tasks. Highlights key setup requirements (model selection, context length configuration, compact prompt usage, and KV cache guidance). Emphasizes privacy and cost advantages, plus when local models excel (offline, privacy-sensitive, cost-conscious development).

---

## Key Takeaways

* Prompt quality is foundational: vague prompts hinder meaningful action; structured techniques (zero-shot, example-based, step-outlined approaches) improve outcomes and predictability.
* Cline’s effectiveness depends heavily on **context assembly** via the system prompt: tools + environment + preferences combine to let the model act directly in your workspace and stay aligned with standards.
* LLM selection is not “one score wins”: benchmarks help narrow options, but tool use, domain needs, speed, and context window requirements drive real-world productivity in Cline workflows.
* Cline’s provider flexibility enables routing strategies: direct providers for latest features, aggregators for multi-provider simplicity, local models for privacy/offline—often mixed by task type.
* The Guides Hub is intentionally practical: it targets operational pain points (AI PR review overload, workflow automation, reliable local model setups) and supplies concrete procedures rather than only conceptual guidance.
