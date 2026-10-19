/**
 * Grounding helpers ported from Pula MaliBoho's grounding_service.py.
 *
 * Pula injects an explicit "authoritative reference data" block and instructs
 * the model to answer *only* from that material, and to say so when the
 * material is insufficient. This is what stops the model from inventing facts,
 * sources or citations. We reuse the same pattern here for CampusOS.
 */

export const ANTI_HALLUCINATION_RULE =
  'Ground every factual claim in the provided material. ' +
  'Do NOT invent facts, figures, authors, titles, page numbers or citations that are not present in the material. ' +
  'If the provided material is insufficient to answer fully, say so explicitly instead of guessing.';

/**
 * Builds the authoritative reference block that is appended to a prompt.
 * Kept identical across providers so behaviour is consistent.
 */
export function buildGroundingBlock(contextMaterials?: string[]): string {
  if (!contextMaterials?.length) return '';

  const materials = contextMaterials
    .map((m, i) => `[Material ${i + 1}]: ${m}`)
    .join('\n\n');

  return (
    '\n\n=== AUTHORITATIVE REFERENCE DATA ===\n' +
    'The following material is the ONLY authorised source for this task. ' +
    'Base your answer strictly on it.\n\n' +
    materials +
    '\n=== END REFERENCE DATA ===\n\n' +
    ANTI_HALLUCINATION_RULE
  );
}
