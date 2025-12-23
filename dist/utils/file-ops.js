"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDir = ensureDir;
exports.copyFile = copyFile;
exports.renderTemplate = renderTemplate;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
async function ensureDir(dir) {
    await promises_1.default.mkdir(dir, { recursive: true });
}
async function copyFile(src, dest) {
    await ensureDir(path_1.default.dirname(dest));
    await promises_1.default.copyFile(src, dest);
}
async function renderTemplate(src, dest, context) {
    await ensureDir(path_1.default.dirname(dest));
    let content = await promises_1.default.readFile(src, 'utf-8');
    for (const [key, value] of Object.entries(context)) {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(placeholder, value);
    }
    await promises_1.default.writeFile(dest, content);
}
