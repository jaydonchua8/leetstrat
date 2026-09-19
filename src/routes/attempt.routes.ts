import { Router } from 'express';
import {
  getAttemptController,
  submitAttemptController,
} from '../controllers/attempt.controller';

const router = Router();

// TODO: mount requireAuth() here and read userId from req.user instead of body.
router.post('/submit', submitAttemptController);
router.get('/:id', getAttemptController);

export default router;
