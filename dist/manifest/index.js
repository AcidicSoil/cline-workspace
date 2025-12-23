"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadManifest = loadManifest;
exports.listWorkflows = listWorkflows;
exports.getWorkflow = getWorkflow;
const MVP_REGISTRY = {
    'pr-review': {
        id: 'pr-review',
        name: 'PR Review',
        description: 'Analyzes PR diffs and provides a pass/fail verdict with feedback.',
        mode: 'headless',
        inputs: [
            { name: 'prNumber', type: 'number', description: 'The Pull Request number', required: true }
        ],
        outputs: [
            { name: 'verdict', type: 'string', description: 'PASS or FAIL' },
            { name: 'report', type: 'string', description: 'Path to the review report artifact' }
        ]
    },
    'changelog': {
        id: 'changelog',
        name: 'Daily Changelog',
        description: 'Summarizes recent commits into a changelog entry.',
        mode: 'headless',
        inputs: [
            { name: 'since', type: 'string', description: 'Git revision or date to start from', required: false },
            { name: 'output', type: 'string', description: 'Output file path', required: false, defaultValue: 'CHANGELOG.md' }
        ],
        outputs: [
            { name: 'summary', type: 'string', description: 'The generated changelog text' }
        ]
    },
    'pre-commit': {
        id: 'pre-commit',
        name: 'Pre-commit Risk Gate',
        description: 'Blocks risky changes before commit.',
        mode: 'headless',
        inputs: [],
        outputs: [
            { name: 'status', type: 'string', description: 'ALLOW or BLOCK' }
        ]
    },
    'lint-sweep': {
        id: 'lint-sweep',
        name: 'Lint Sweep & Auto-Fix',
        description: 'Runs linters and attempts to fix errors using AI.',
        mode: 'headless',
        inputs: [
            { name: 'command', type: 'string', description: 'Lint command to run', required: true }
        ],
        outputs: [
            { name: 'fixedFiles', type: 'string', description: 'List of fixed files' }
        ]
    }
};
async function loadManifest() {
    // In the future, this could load from a file. For now, return the static registry.
    return MVP_REGISTRY;
}
function listWorkflows() {
    return Object.values(MVP_REGISTRY);
}
function getWorkflow(id) {
    return MVP_REGISTRY[id];
}
