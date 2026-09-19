import { Router } from 'express';
import {
  getProblemController,
  listProblemsController,
} from '../controllers/problem.controller';

const router = Router();

router.get('/', listProblemsController);
router.get('/:idOrSlug', getProblemController);

export default router;
