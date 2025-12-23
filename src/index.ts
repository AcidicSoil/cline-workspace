import 'dotenv/config'; // Load environment variables
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);

export const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.5-flash'),
});

export const helloFlow = ai.defineFlow(
  {
    name: 'helloFlow',
    inputSchema: z.string().describe('Your name'),
    outputSchema: z.string().describe('A greeting'),
  },
  async (name) => {
    try {
      console.log('Running helloFlow for:', name);
      const response = await ai.generate(`Hello, ${name}! Say something nice back.`);
      console.log('Response generated');
      return response.text;
    } catch (e) {
      console.error('Error in helloFlow:', e);
      throw e;
    }
  }
);

// Define the schema for a task
const TaskSchema = z.object({
  title: z.string().describe('The title of the task'),
  description: z.string().describe('A brief description of what needs to be done'),
  priority: z.enum(['high', 'medium', 'low']).describe('The priority level of the task'),
});

// Create a flow that generates tasks based on a goal
export const taskGeneratorFlow = ai.defineFlow(
  {
    name: 'taskGeneratorFlow',
    inputSchema: z.string().describe('The goal or project to break down into tasks'),
    outputSchema: z.array(TaskSchema).describe('A list of actionable tasks'),
  },
  async (goal) => {
    try {
        const { output } = await ai.generate({
        prompt: `Break down the following goal into a list of concise, actionable tasks: "${goal}"`,
        output: { schema: z.array(TaskSchema) },
        });

        if (!output) {
        throw new Error('Failed to generate tasks');
        }

        return output;
    } catch (e) {
        console.error('Error in taskGeneratorFlow:', e);
        throw e;
    }
  }
);