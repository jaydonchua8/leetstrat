import { COMPLEXITY_LABEL, GradedAttempt, ProblemAnswerKey } from '../types';

/**
 * Swap implementations without touching the attempt pipeline.
 * `generate` must never throw — return null on failure.
 */
export interface FeedbackProvider {
  generate(graded: GradedAttempt, key: ProblemAnswerKey): Promise<string | null>;
}

/** Builds the prompt. Extracted so it can be snapshot-tested. */
export function buildFeedbackPrompt(
  graded: GradedAttempt,
  key: ProblemAnswerKey,
): string {
  const missedEdgeCases = graded.edgeCases.matches
    .filter((m) => !m.matched)
    .map((m) => m.description);

  return [
    `Problem: ${key.title} (${key.difficulty})`,
    `Optimal approach: ${key.approachSummary}`,
    `Why: ${key.explanation}`,
    `Optimal complexity: time ${COMPLEXITY_LABEL[key.primaryTimeComplexity]}, ` +
      `space ${COMPLEXITY_LABEL[key.primarySpaceComplexity]}`,
    `Learner chose technique: ${graded.technique.selected}` +
      (graded.technique.isCorrect ? '' : ` (intended: ${graded.technique.primary})`),
    `Learner chose data structure: ${graded.dataStructure.selected}` +
      (graded.dataStructure.isCorrect ? '' : ` (intended: ${graded.dataStructure.primary})`),
    `Learner chose time complexity: ${graded.timeComplexity.selectedLabel} ` +
      `(${graded.timeComplexity.direction})`,
    missedEdgeCases.length > 0
      ? `Learner did not mention edge cases: ${missedEdgeCases.join('; ')}`
      : '',
    '',
    'Write exactly two sentences explaining why the optimal approach works. ' +
      'Address the learner directly. Do not restate the problem. Do not write code.',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * PLACEHOLDER — deterministic, no network. Wire a real provider here.
 *
 * Example replacement (Anthropic SDK):
 *
 *   const res = await anthropic.messages.create({
 *     model: 'claude-sonnet-5',
 *     max_tokens: 200,
 *     messages: [{ role: 'user', content: buildFeedbackPrompt(graded, key) }],
 *   });
 *   return res.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
 *
 * Keep the try/catch: an LLM outage must degrade to null feedback, not a 500.
 */
export class StubFeedbackProvider implements FeedbackProvider {
  async generate(
    graded: GradedAttempt,
    key: ProblemAnswerKey,
  ): Promise<string | null> {
    try {
      const opener = graded.isFullyCorrect
        ? 'Correct on all counts.'
        : `The intended approach is ${key.primaryTechnique.replace(/_/g, ' ').toLowerCase()}.`;

      return (
        `${opener} ${key.approachSummary} This lands at ` +
        `${COMPLEXITY_LABEL[key.primaryTimeComplexity]} time and ` +
        `${COMPLEXITY_LABEL[key.primarySpaceComplexity]} space.`
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[feedback] generation failed', err);
      return null;
    }
  }
}
