import { Router } from 'express';
import { route as coreRouter } from './core';
import { route as notifyRouter } from './notify';

const router = Router();

router.use('/assets/notify', notifyRouter);
router.use('/assets', coreRouter);

export { router };
