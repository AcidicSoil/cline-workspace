"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseVerdict = parseVerdict;
const DEFAULT_CONFIG = {
    failOnUnknown: true,
    defaultVerdict: 'BLOCK',
};
/**
 * Extracts the content within [VERDICT]...[/VERDICT] tags or looks for the headers if tags are missing.
 * For now, we'll assume a structured format like:
 * [VERDICT]
 * Status: PASS
 * Confidence: 0.95
 * Reasoning: ...
 * [/VERDICT]
 */
function extractVerdictSection(output) {
    const match = output.match(/\[VERDICT\]([\s\S]*?)\[\/VERDICT\]/i);
    if (match) {
        return match[1].trim();
    }
    // Fallback: try to find "Status:" and "Reasoning:" if no tags
    if (output.match(/Status:/i) && output.match(/Reasoning:/i)) {
        return output;
    }
    return null;
}
function parseStatus(text) {
    const match = text.match(/Status:\s*(PASS|FAIL|ALLOW|BLOCK)/i);
    if (match) {
        return match[1].toUpperCase();
    }
    return null;
}
function parseConfidence(text) {
    const match = text.match(/Confidence:\s*([0-9]*\.?[0-9]+)/i);
    if (match) {
        const val = parseFloat(match[1]);
        return isNaN(val) ? 0 : Math.min(Math.max(val, 0), 1);
    }
    return 0; // Default confidence
}
function parseReasoning(text) {
    const match = text.match(/Reasoning:\s*([\s\S]*?)(?:$|Status:|Confidence:)/i);
    if (match) {
        return match[1].trim();
    }
    // If we extracted a section, maybe the whole thing (minus headers) is reasoning?
    // For now, let's just return "No specific reasoning found" or part of the text.
    return "No specific reasoning parsed.";
}
function parseVerdict(modelOutput, config = DEFAULT_CONFIG) {
    const section = extractVerdictSection(modelOutput);
    if (!section) {
        return {
            verdict: config.defaultVerdict,
            confidence: 0,
            reasoning: "Failed to extract verdict section from output.",
        };
    }
    const status = parseStatus(section);
    const confidence = parseConfidence(section);
    // Improved reasoning extraction: take everything after "Reasoning:" until end of string
    const reasoningMatch = section.match(/Reasoning:\s*([\s\S]*)/i);
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : "No reasoning provided.";
    if (!status) {
        return {
            verdict: config.defaultVerdict,
            confidence: 0,
            reasoning: `Found verdict section but failed to parse status. Extracted: ${section.substring(0, 50)}...`,
        };
    }
    return {
        verdict: status,
        confidence,
        reasoning,
    };
}
