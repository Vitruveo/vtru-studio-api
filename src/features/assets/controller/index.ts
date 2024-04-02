import { Router } from 'express';
import { route as coreRouter } from './core';
import { route as notifyRouter } from './notify';
import { route as publicRouter } from './public';
import { route as previewRouter } from './preview';
import { route as storeRouter } from './store';

const router = Router();

router.use('/assets/notify', notifyRouter);
router.use('/assets/public', publicRouter);
router.use('/assets/preview', previewRouter);
router.use('/assets/store', storeRouter);
router.use('/assets', coreRouter);

export { router };
