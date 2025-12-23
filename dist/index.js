"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskGeneratorFlow = exports.helloFlow = exports.ai = void 0;
require("dotenv/config"); // Load environment variables
const genkit_1 = require("genkit");
const google_genai_1 = require("@genkit-ai/google-genai");
console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
exports.ai = (0, genkit_1.genkit)({
    plugins: [(0, google_genai_1.googleAI)()],
    model: google_genai_1.googleAI.model('gemini-2.5-flash'),
});
exports.helloFlow = exports.ai.defineFlow({
    name: 'helloFlow',
    inputSchema: genkit_1.z.string().describe('Your name'),
    outputSchema: genkit_1.z.string().describe('A greeting'),
}, async (name) => {
    try {
        console.log('Running helloFlow for:', name);
        const response = await exports.ai.generate(`Hello, ${name}! Say something nice back.`);
        console.log('Response generated');
        return response.text;
    }
    catch (e) {
        console.error('Error in helloFlow:', e);
        throw e;
    }
});
// Define the schema for a task
const TaskSchema = genkit_1.z.object({
    title: genkit_1.z.string().describe('The title of the task'),
    description: genkit_1.z.string().describe('A brief description of what needs to be done'),
    priority: genkit_1.z.enum(['high', 'medium', 'low']).describe('The priority level of the task'),
});
// Create a flow that generates tasks based on a goal
exports.taskGeneratorFlow = exports.ai.defineFlow({
    name: 'taskGeneratorFlow',
    inputSchema: genkit_1.z.string().describe('The goal or project to break down into tasks'),
    outputSchema: genkit_1.z.array(TaskSchema).describe('A list of actionable tasks'),
}, async (goal) => {
    try {
        const { output } = await exports.ai.generate({
            prompt: `Break down the following goal into a list of concise, actionable tasks: "${goal}"`,
            output: { schema: genkit_1.z.array(TaskSchema) },
        });
        if (!output) {
            throw new Error('Failed to generate tasks');
        }
        return output;
    }
    catch (e) {
        console.error('Error in taskGeneratorFlow:', e);
        throw e;
    }
});
