"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAuth = checkAuth;
exports.viewPr = viewPr;
exports.diffPr = diffPr;
exports.submitReview = submitReview;
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const execAsync = util_1.default.promisify(child_process_1.exec);
async function execGh(command) {
    try {
        const { stdout } = await execAsync(`gh ${command}`);
        return stdout.trim();
    }
    catch (error) {
        throw new Error(`GitHub CLI command failed: gh ${command}\n${error.message}`);
    }
}
async function checkAuth() {
    try {
        await execGh('auth status');
        return true;
    }
    catch {
        return false;
    }
}
async function viewPr(prNumber) {
    const output = await execGh(`pr view ${prNumber} --json number,title,body,baseRefName,headRefName,headRefOid`);
    return JSON.parse(output);
}
async function diffPr(prNumber) {
    return execGh(`pr diff ${prNumber}`);
}
async function submitReview(prNumber, body, event) {
    let flag = '--comment';
    if (event === 'APPROVE')
        flag = '--approve';
    if (event === 'REQUEST_CHANGES')
        flag = '--request-changes';
    // Escaping quotes for shell
    const escapedBody = body.replace(/"/g, '\\"');
    await execGh(`pr review ${prNumber} ${flag} --body "${escapedBody}"`);
}
