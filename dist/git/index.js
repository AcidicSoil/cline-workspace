"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.execGit = execGit;
exports.getCommitLog = getCommitLog;
exports.getStagedDiff = getStagedDiff;
exports.getRangeDiff = getRangeDiff;
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const execAsync = util_1.default.promisify(child_process_1.exec);
const MAX_BUFFER = 10 * 1024 * 1024; // 10MB
async function execGit(command, options = {}) {
    try {
        const { stdout } = await execAsync(`git ${command}`, {
            maxBuffer: MAX_BUFFER,
            ...options
        });
        return (typeof stdout === 'string' ? stdout : stdout.toString()).trim();
    }
    catch (error) {
        throw new Error(`Git command failed: git ${command}\n${error.message}`);
    }
}
async function getCommitLog(count = 10) {
    // Format: "hash|author|date|message"
    const format = '%h|%an|%ad|%s';
    return execGit(`log -n ${count} --pretty=format:"${format}"`);
}
async function getStagedDiff() {
    return execGit('diff --cached');
}
async function getRangeDiff(base, head) {
    return execGit(`diff ${base}..${head}`);
}
