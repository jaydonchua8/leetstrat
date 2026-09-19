import { Router } from 'express';
import attemptRoutes from './attempt.routes';
import codexRoutes from './codex.routes';
import problemRoutes from './problem.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.use('/problems', problemRoutes);
router.use('/attempts', attemptRoutes);
router.use('/codex', codexRoutes);

export default router;
