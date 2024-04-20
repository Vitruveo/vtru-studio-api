import { Router } from 'express';
import { route as coreRouter } from './core';
import { route as makeVideoRouter } from './makeVideo';
import { route as notifyRouter } from './notify';
import { route as publicRouter } from './public';
import { route as previewRouter } from './preview';
import { route as storeRouter } from './store';
import { route as ipfsRouter } from './ipfs';
import { route as contractRouter } from './contract';

const router = Router();

router.use('/assets/ipfs', ipfsRouter);
router.use('/assets/contract', contractRouter);
router.use('/assets/makeVideo', makeVideoRouter);
router.use('/assets/notify', notifyRouter);
router.use('/assets/public', publicRouter);
router.use('/assets/preview', previewRouter);
router.use('/assets/store', storeRouter);
router.use('/assets', coreRouter);

export { router };
