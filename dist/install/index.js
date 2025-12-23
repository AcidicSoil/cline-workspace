"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computePlan = computePlan;
exports.installPack = installPack;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const hooks_1 = require("./hooks");
async function computePlan(targetDir) {
    const packDir = path_1.default.join(__dirname, '../../pack');
    const plan = [];
    // Workflows
    const workflowSrc = path_1.default.join(packDir, 'workflows');
    const workflowDest = path_1.default.join(targetDir, '.clinerules/workflows');
    const workflowFiles = await promises_1.default.readdir(workflowSrc).catch(() => []);
    for (const file of workflowFiles) {
        const destPath = path_1.default.join(workflowDest, file);
        const exists = await promises_1.default.access(destPath).then(() => true).catch(() => false);
        plan.push({
            source: path_1.default.join(workflowSrc, file),
            target: destPath,
            action: exists ? 'overwrite' : 'create' // Default policy
        });
    }
    // Scripts
    const scriptSrc = path_1.default.join(packDir, 'scripts');
    const scriptDest = path_1.default.join(targetDir, 'scripts/cline');
    const scriptFiles = await promises_1.default.readdir(scriptSrc).catch(() => []);
    for (const file of scriptFiles) {
        const destPath = path_1.default.join(scriptDest, file);
        const exists = await promises_1.default.access(destPath).then(() => true).catch(() => false);
        plan.push({
            source: path_1.default.join(scriptSrc, file),
            target: destPath,
            action: exists ? 'overwrite' : 'create'
        });
    }
    return plan;
}
async function installPack(targetDir, options = {}) {
    const plan = await computePlan(targetDir);
    for (const item of plan) {
        if (item.action === 'skip')
            continue;
        if (item.action === 'overwrite' && options.overwrite === false) {
            console.log(`⏭️ Skipping existing file: ${path_1.default.relative(targetDir, item.target)}`);
            continue;
        }
        await promises_1.default.mkdir(path_1.default.dirname(item.target), { recursive: true });
        await promises_1.default.copyFile(item.source, item.target);
        console.log(`✅ ${item.action === 'create' ? 'Created' : 'Updated'}: ${path_1.default.relative(targetDir, item.target)}`);
    }
    // Install Git Hook
    await (0, hooks_1.installPreCommitHook)();
}
