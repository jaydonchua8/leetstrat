import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { listCodexQuerySchema } from '../validation/query.schema';
import { getCodexEntry, listCodexEntries } from '../services/codex.service';
import { ValidationError } from '../lib/errors';

/** GET /api/codex?kind= */
export async function listCodexController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filter = listCodexQuerySchema.parse(req.query);
    const entries = await listCodexEntries(filter);
    res.json({ success: true, data: entries });
  } catch (err) {
    if (err instanceof ZodError) {
      next(new ValidationError('Invalid query', err.flatten()));
      return;
    }
    next(err);
  }
}

/** GET /api/codex/:slug */
export async function getCodexController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const entry = await getCodexEntry(String(req.params.slug));
    res.json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
}
