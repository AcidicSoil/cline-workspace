export interface GeminiTaskStatus {
  id: string; // Stable ID
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export interface GeminiFlowProvider {
  getTaskStatuses(): Promise<GeminiTaskStatus[]>;
}

export class MockGeminiFlowProvider implements GeminiFlowProvider {
  private mockData: GeminiTaskStatus[] = [];

  constructor(data: GeminiTaskStatus[] = []) {
    this.mockData = data;
  }

  async getTaskStatuses(): Promise<GeminiTaskStatus[]> {
    return Promise.resolve(this.mockData);
  }
}
