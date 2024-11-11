import { Router } from 'express';
import { route as coreRouter } from './core';
import { route as uploadRouter } from './upload';

const router = Router();

router.use('/stores', coreRouter);
router.use('/stores/upload', uploadRouter);

export { router };
