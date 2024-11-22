import { Router } from 'express';
import { route as coreRouter } from './core';
import { route as uploadRouter } from './upload';
import { route as publicRouter } from './public';

const router = Router();

router.use('/stores/upload', uploadRouter);
router.use('/stores/public', publicRouter);
router.use('/stores', coreRouter);

export { router };
