export type Verdict = 'PASS' | 'FAIL' | 'ALLOW' | 'BLOCK' | 'UNKNOWN';

export interface GatingPolicy {
  failOnUnknown: boolean;
}

export function parseVerdict(text: string): Verdict {
  // Look for bold markers or standalone keywords
  // Priority: BLOCK/ALLOW (often used in gates) then FAIL/PASS
  const blockMatch = /\b(BLOCK)\b/i.exec(text);
  if (blockMatch) return 'BLOCK';

  const allowMatch = /\b(ALLOW)\b/i.exec(text);
  if (allowMatch) return 'ALLOW';

  const failMatch = /\b(FAIL)\b/i.exec(text);
  if (failMatch) return 'FAIL';

  const passMatch = /\b(PASS)\b/i.exec(text);
  if (passMatch) return 'PASS';

  return 'UNKNOWN';
}

export function shouldFail(verdict: Verdict, policy: GatingPolicy = { failOnUnknown: true }): boolean {
  switch (verdict) {
    case 'BLOCK':
    case 'FAIL':
      return true;
    case 'ALLOW':
    case 'PASS':
      return false;
    case 'UNKNOWN':
    default:
      return policy.failOnUnknown;
  }
}
