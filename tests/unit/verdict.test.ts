import { parseVerdict, Verdict } from '../../src/gating/verdict';

describe('Verdict Parsing', () => {
  it('should parse a valid PASS verdict with tags', () => {
    const input = `
      Some preamble...
      [VERDICT]
      Status: PASS
      Confidence: 0.95
      Reasoning: The code looks good and follows all guidelines.
      [/VERDICT]
      Some postscript...
    `;
    const result = parseVerdict(input);
    expect(result.verdict).toBe('PASS');
    expect(result.confidence).toBe(0.95);
    expect(result.reasoning).toBe('The code looks good and follows all guidelines.');
  });

  it('should parse a valid FAIL verdict', () => {
    const input = `
      [VERDICT]
      Status: FAIL
      Confidence: 0.8
      Reasoning: Security vulnerability detected.
      [/VERDICT]
    `;
    const result = parseVerdict(input);
    expect(result.verdict).toBe('FAIL');
    expect(result.confidence).toBe(0.8);
    expect(result.reasoning).toBe('Security vulnerability detected.');
  });

  it('should fallback to BLOCK on missing verdict tags/section', () => {
    const input = "Just some random chat from the model.";
    const result = parseVerdict(input);
    expect(result.verdict).toBe('BLOCK');
    expect(result.reasoning).toContain('Failed to extract verdict section');
  });

  it('should fallback to BLOCK on unparseable status', () => {
    const input = `
      [VERDICT]
      Status: UNSURE
      Reasoning: I don't know.
      [/VERDICT]
    `;
    const result = parseVerdict(input);
    expect(result.verdict).toBe('BLOCK');
    expect(result.reasoning).toContain('failed to parse status');
  });

  it('should handle case insensitivity', () => {
    const input = `[VERDICT] status: pass confidence: 1.0 reasoning: ok [/VERDICT]`;
    const result = parseVerdict(input);
    expect(result.verdict).toBe('PASS');
  });
});
