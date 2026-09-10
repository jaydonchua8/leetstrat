import { Router } from 'express';
import { submitAttemptController } from '../controllers/attempt.controller';

const router = Router();

// TODO: mount requireAuth() here and read userId from req.user instead of body.
router.post('/submit', submitAttemptController);

export default router;
