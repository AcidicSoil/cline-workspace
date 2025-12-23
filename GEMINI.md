# **Project Context: Cline Workflow Pack**

## **1\. Executive Summary**

Goal: Create a standardized, installable "pack" of daily software engineering workflows (PR reviews, changelogs, risk gates) powered by the Cline CLI.
Problem: Automation scripts are currently scattered, brittle, and lack standardized safety gates.
Solution: A TypeScript-based runner library and a set of Markdown workflow definitions that provide reliable, headless, or interactive AI automation.

## **2\. Technical Architecture**

### **Core Stack**

* **Runtime:** Node.js (TypeScript)
* **Core Tooling:** Cline CLI (interactive & headless modes)
* **Integrations:** Git (native), GitHub CLI (gh)
* **Format:** Markdown for Prompts, JSON/Text for Artifacts

### **Directory Structure**

workflow-pack/
├── pack/                         \# Versioned workflow templates (Markdown/Shell)
├── src/
│   ├── manifest/                 \# Workflow registry & metadata
│   ├── install/                  \# Installation logic (copying pack to target repo)
│   ├── cline/                    \# Cline CLI wrapper (headless/interactive/monitoring)
│   ├── git/                      \# Git diff/log extraction helpers
│   ├── github/                   \# GitHub CLI wrappers (PR view/review)
│   ├── gating/                   \# Verdict parsing (PASS/FAIL) & threshold logic
│   ├── render/                   \# Template interpolation engine
│   └── report/                   \# Artifact writing & summary formatting
└── bin/                          \# CLI Entry point (cline-pack)

### **Key Modules**

1. **Manifest:** Defines available workflows, inputs, and execution modes.
2. **Cline Wrapper:** Handles spawning cline task new (headless) or cline (interactive).
3. **Gating:** Parses robust "verdicts" (ALLOW/BLOCK) from AI responses to enforce CI gates.
4. **Report:** Ensures every run produces an audit artifact (JSON/Markdown).

## **3\. Development Roadmap & Status**

**Current Phase:** Phase 0/1 (Foundation & Execution Layers)

| ID | Priority | Task Name | Status | Dependencies |
| :---- | :---- | :---- | :---- | :---- |
| **1** | High | **Init Project & Manifest** | Pending | None |
| **2** | High | **Render & Report Modules** | Pending | Task 1 |
| **3** | High | **Git & Cline Wrappers** | Pending | Task 2 |
| **4** | Med | **Gating & GitHub Integration** | Pending | Task 3 |
| **5** | High | **Pre-commit Risk Gate** | Pending | Task 4 |
| **6** | High | **CI PR Review Gate** | Pending | Task 4 |
| **7** | Med | **Daily Changelog Workflow** | Pending | Task 3 |
| **8** | Med | **Lint Sweep & Auto-Fix** | Pending | Task 3 |
| **9** | Med | **Pack Installation Module** | Pending | Task 1, 2 |
| **10** | Med | **CLI Entry Point & E2E** | Pending | All Previous |

## **4\. Coding & Testing Guidelines**

* **Language:** TypeScript (Strict mode).
* **Testing:**
  * **Unit:** Jest/Vitest for parsing logic (Manifest, Gating, Render).
  * **Integration:** Mock child\_process for Git/Cline/GitHub CLI calls.
  * **E2E:** Use temporary git repositories to validate hook installation and full workflow runs.
* **Artifacts:** All workflows *must* write a tangible artifact (log, report, or diff) to .clinerules/artifacts or a temp directory.
* **Safety:** Never run a "fix" workflow without a verification step (lint/test) afterwards.

## **5\. Critical Constraints**

1. **Single-Source of Truth:** Workflows live in pack/ but are installed to .clinerules/workflows in target repos.
2. **Headless Reliability:** Scripts must handle timeouts and malformed LLM outputs gracefully (defaulting to "Fail Closed" in CI).
3. **Dependencies:** Users are expected to have cline and git installed. gh is optional but required for PR workflows.
