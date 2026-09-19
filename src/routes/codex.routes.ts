import { Router } from 'express';
import { getCodexController, listCodexController } from '../controllers/codex.controller';

const router = Router();

router.get('/', listCodexController);
router.get('/:slug', getCodexController);

export default router;
