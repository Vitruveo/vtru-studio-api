import { Router } from 'express';
import { route as coreRouter } from './core';
import { route as notifyRouter } from './notify';
import { route as publicRouter } from './public';

const router = Router();

router.use('/assets/notify', notifyRouter);
router.use('/assets/public', publicRouter);
router.use('/assets', coreRouter);

export { router };
