import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { submitAttemptSchema } from '../validation/attempt.schema';
import { submitAttempt } from '../services/attempt.service';
import { StubFeedbackProvider } from '../services/feedback.service';
import { ValidationError } from '../lib/errors';

// Swap for a real LLM-backed provider here, or inject via a DI container.
const feedbackProvider = new StubFeedbackProvider();

/** POST /api/attempts/submit */
export async function submitAttemptController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = submitAttemptSchema.parse(req.body);
    const result = await submitAttempt(input, feedbackProvider);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof ZodError) {
      next(new ValidationError('Invalid submission payload', err.flatten()));
      return;
    }
    next(err);
  }
}
