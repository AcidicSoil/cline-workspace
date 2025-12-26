"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLmStudioPlugin = generateLmStudioPlugin;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const scaffold_1 = require("./scaffold");
const toolsGenerator_1 = require("./toolsGenerator");
async function generateLmStudioPlugin(options) {
    await promises_1.default.mkdir(options.outputDir, { recursive: true });
    await promises_1.default.mkdir(path_1.default.join(options.outputDir, 'src'), { recursive: true });
    const files = [
        { path: path_1.default.join(options.outputDir, 'manifest.json'), content: (0, scaffold_1.buildManifest)(options) },
        { path: path_1.default.join(options.outputDir, 'package.json'), content: (0, scaffold_1.buildPackageJson)(options) },
        { path: path_1.default.join(options.outputDir, 'tsconfig.json'), content: (0, scaffold_1.buildTsconfig)() },
        { path: path_1.default.join(options.outputDir, 'src', 'index.ts'), content: (0, scaffold_1.buildIndexSource)() },
        { path: path_1.default.join(options.outputDir, 'src', 'config.ts'), content: (0, scaffold_1.buildConfigSource)() },
        { path: path_1.default.join(options.outputDir, 'src', 'toolsProvider.ts'), content: (0, toolsGenerator_1.buildToolsProviderSource)() }
    ];
    for (const file of files) {
        await promises_1.default.writeFile(file.path, file.content, 'utf-8');
    }
}
