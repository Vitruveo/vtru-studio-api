import { Router } from 'express';
import { route as coreRouter } from './core';
import { route as videoGalleryRouter } from './videoGallery';
import { route as notifyRouter } from './notify';
import { route as publicRouter } from './public';
import { route as previewRouter } from './preview';
import { route as storeRouter } from './store';
import { route as ipfsRouter } from './ipfs';
import { route as consignRouter } from './consign';
import { route as scopeRouter } from './scope';
import { route as adminRouter } from './admin';

const router = Router();

router.use('/assets/ipfs', ipfsRouter);
router.use('/assets/consign', consignRouter);
router.use('/assets/videoGallery', videoGalleryRouter);
router.use('/assets/notify', notifyRouter);
router.use('/assets/public', publicRouter);
router.use('/assets/preview', previewRouter);
router.use('/assets/store', storeRouter);
router.use('/assets/scope', scopeRouter);
router.use('/assets/admin', adminRouter);
router.use('/assets', coreRouter);

export { router };
