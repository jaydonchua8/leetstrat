import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { listProblemsQuerySchema } from '../validation/query.schema';
import { getProblem, listProblems } from '../services/problem.service';
import { ValidationError } from '../lib/errors';

/** GET /api/problems?difficulty= */
export async function listProblemsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filter = listProblemsQuerySchema.parse(req.query);
    const problems = await listProblems(filter);
    res.json({ success: true, data: problems });
  } catch (err) {
    if (err instanceof ZodError) {
      next(new ValidationError('Invalid query', err.flatten()));
      return;
    }
    next(err);
  }
}

/** GET /api/problems/:idOrSlug */
export async function getProblemController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const problem = await getProblem(String(req.params.idOrSlug));
    res.json({ success: true, data: problem });
  } catch (err) {
    next(err);
  }
}
