"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStableId = generateStableId;
exports.importToGeminiFlow = importToGeminiFlow;
const crypto_1 = __importDefault(require("crypto"));
function generateStableId(task) {
    const hash = crypto_1.default.createHash('sha256');
    hash.update(task.title);
    if (task.description)
        hash.update(task.description);
    return hash.digest('hex').substring(0, 12);
}
function importToGeminiFlow(graph) {
    const idMap = {};
    const geminiTasks = [];
    // First pass: generate stable IDs
    function processNodeIds(nodes) {
        for (const node of nodes) {
            if (!idMap[node.id]) {
                idMap[node.id] = generateStableId(node);
            }
            if (node.subtasks) {
                processNodeIds(node.subtasks);
            }
        }
    }
    processNodeIds(graph.tasks);
    // Second pass: generate tasks with mapped dependencies
    function processNodes(nodes, parentId) {
        for (const node of nodes) {
            const stableId = idMap[node.id];
            const prereqs = [];
            // Add declared dependencies
            if (node.dependencies) {
                for (const dep of node.dependencies) {
                    const depStr = String(dep);
                    if (idMap[depStr]) {
                        prereqs.push(idMap[depStr]);
                    }
                }
            }
            // If subtask, strict dependency on parent? 
            // Often subtasks just belong to parent. 
            // For now, let's treat them as separate tasks, maybe linking via metadata or implicit dependency if needed.
            // PRD doesn't specify strictly, but parent usually comes before child.
            if (parentId) {
                // Optional: Add parent as prerequisite?
                // prereqs.push(parentId);
            }
            geminiTasks.push({
                id: stableId,
                name: node.title,
                description: node.description,
                prerequisites: prereqs,
                metadata: {
                    originalId: node.id,
                    priority: node.priority,
                    status: node.status || 'pending',
                }
            });
            if (node.subtasks) {
                processNodes(node.subtasks, stableId);
            }
        }
    }
    processNodes(graph.tasks);
    return {
        tasks: geminiTasks,
        idMap,
    };
}
