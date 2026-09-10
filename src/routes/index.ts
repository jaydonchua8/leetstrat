import { Router } from 'express';
import attemptRoutes from './attempt.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.use('/attempts', attemptRoutes);

export default router;
