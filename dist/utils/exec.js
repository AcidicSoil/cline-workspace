"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCommand = executeCommand;
const child_process_1 = require("child_process");
async function executeCommand(command, args, env = process.env) {
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(command, args, { env });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        child.on('error', (err) => {
            reject(err);
        });
        child.on('close', (code) => {
            resolve({
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                exitCode: code ?? -1,
            });
        });
    });
}
