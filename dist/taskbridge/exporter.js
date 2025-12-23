"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportFromGeminiFlow = exportFromGeminiFlow;
const promises_1 = __importDefault(require("fs/promises"));
function mapExternalStatus(external) {
    switch (external) {
        case 'completed': return 'done';
        case 'failed': return 'blocked'; // Or failed? PRD says 'blocked' for dependencies? Let's use 'blocked' or keep 'pending' if failed?
        // Let's map 'failed' to 'blocked' for now to indicate intervention needed.
        case 'in-progress': return 'in-progress';
        default: return 'pending';
    }
}
async function exportFromGeminiFlow(options) {
    const externalStatuses = await options.provider.getTaskStatuses();
    const snapshot = {
        timestamp: new Date().toISOString(),
        tasks: {}
    };
    // Reverse ID map for lookup: Stable ID -> Internal ID
    const stableToInternal = {};
    for (const [internalId, stableId] of Object.entries(options.idMap)) {
        stableToInternal[stableId] = internalId;
    }
    for (const status of externalStatuses) {
        const internalId = stableToInternal[status.id];
        if (internalId) {
            snapshot.tasks[internalId] = {
                status: mapExternalStatus(status.status)
            };
        }
    }
    await promises_1.default.writeFile(options.outputPath, JSON.stringify(snapshot, null, 2));
    return snapshot;
}
