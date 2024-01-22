import { Router } from 'express';
import { route as coreRouter } from './core';
import { route as attemptRouter } from './attempt';

const router = Router();

router.use('/waitingList/attempt', attemptRouter);
router.use('/waitingList', coreRouter);

export { router };
