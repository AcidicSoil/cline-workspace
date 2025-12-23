"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockGeminiFlowProvider = void 0;
class MockGeminiFlowProvider {
    mockData = [];
    constructor(data = []) {
        this.mockData = data;
    }
    async getTaskStatuses() {
        return Promise.resolve(this.mockData);
    }
}
exports.MockGeminiFlowProvider = MockGeminiFlowProvider;
