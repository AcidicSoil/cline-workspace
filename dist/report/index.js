"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeArtifact = writeArtifact;
exports.formatSummary = formatSummary;
exports.formatJson = formatJson;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const ARTIFACTS_DIR = '.clinerules/artifacts';
async function writeArtifact(relativePath, content) {
    const fullPath = path_1.default.join(process.cwd(), ARTIFACTS_DIR, relativePath);
    const dir = path_1.default.dirname(fullPath);
    await promises_1.default.mkdir(dir, { recursive: true });
    // Atomic write: write to temp file then rename
    const tempPath = `${fullPath}.${crypto_1.default.randomBytes(4).toString('hex')}.tmp`;
    try {
        await promises_1.default.writeFile(tempPath, content, 'utf-8');
        await promises_1.default.rename(tempPath, fullPath);
    }
    catch (err) {
        // Attempt cleanup if rename failed
        await promises_1.default.unlink(tempPath).catch(() => { });
        throw err;
    }
    return fullPath;
}
function formatSummary(title, items) {
    return `# ${title}\n\n${items.map(item => `- ${item}`).join('\n')}\n`;
}
function formatJson(data) {
    return JSON.stringify(data, null, 2);
}
