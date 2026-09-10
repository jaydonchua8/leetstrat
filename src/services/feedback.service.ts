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
  const missedTechniques = [
    ...graded.techniques.missing,
    ...graded.techniques.extra,
  ];

  return [
    `Problem: ${key.title} (${key.difficulty})`,
    `Optimal approach: ${key.optimalApproachSummary}`,
    `Optimal complexity: time ${COMPLEXITY_LABEL[key.optimalTimeComplexity]}, ` +
      `space ${COMPLEXITY_LABEL[key.optimalSpaceComplexity]}`,
    `Learner chose techniques: ${graded.techniques.selected.join(', ') || 'none'}`,
    `Learner chose time complexity: ${graded.timeComplexity.selectedLabel} ` +
      `(${graded.timeComplexity.direction})`,
    missedTechniques.length > 0
      ? `Learner's technique gap: ${missedTechniques.join(', ')}`
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
 *     model: 'claude-sonnet-4-6',
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
      const technique = key.correctTechniques[0] ?? 'the intended technique';
      const opener = graded.isFullyCorrect
        ? 'Correct on all counts.'
        : `The optimal approach relies on ${technique}.`;

      return (
        `${opener} ${key.optimalApproachSummary} This lands at ` +
        `${COMPLEXITY_LABEL[key.optimalTimeComplexity]} time and ` +
        `${COMPLEXITY_LABEL[key.optimalSpaceComplexity]} space.`
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[feedback] generation failed', err);
      return null;
    }
  }
}
