import { Router } from 'express';
import { route as coreRouter } from './core';
import { route as checkRouter } from './check';

const router = Router();

router.use('/allowList/check', checkRouter);
router.use('/allowList', coreRouter);

export { router };
