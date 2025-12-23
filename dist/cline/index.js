"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runHeadless = runHeadless;
exports.runInteractive = runInteractive;
exports.followTask = followTask;
const child_process_1 = require("child_process");
async function runHeadless(prompt, opts = {}) {
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)('cline', ['task', 'new', prompt], {
            cwd: opts.cwd || process.cwd(),
            env: { ...process.env, ...opts.env },
            stdio: ['ignore', 'pipe', 'pipe'] // Ignore stdin, pipe stdout/stderr
        });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        if (opts.timeout) {
            setTimeout(() => {
                child.kill();
                reject(new Error(`Cline task timed out after ${opts.timeout}ms`));
            }, opts.timeout);
        }
        child.on('close', (code) => {
            resolve({
                stdout,
                stderr,
                exitCode: code
            });
        });
        child.on('error', (err) => {
            reject(err);
        });
    });
}
async function runInteractive(prompt, opts = {}) {
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)('cline', ['task', 'new', prompt], {
            cwd: opts.cwd || process.cwd(),
            env: { ...process.env, ...opts.env },
            stdio: 'inherit' // Inherit stdio for interaction
        });
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                reject(new Error(`Cline exited with code ${code}`));
            }
        });
        child.on('error', (err) => {
            reject(err);
        });
    });
}
async function followTask(taskId, opts = {}) {
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)('cline', ['task', 'view', taskId], {
            cwd: opts.cwd || process.cwd(),
            env: { ...process.env, ...opts.env },
            stdio: 'inherit'
        });
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                reject(new Error(`Cline view exited with code ${code}`));
            }
        });
        child.on('error', (err) => {
            reject(err);
        });
    });
}
