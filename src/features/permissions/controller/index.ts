import { Router } from 'express';
import { route as coreRouter } from './core';

const router = Router();

router.use('/permissions', coreRouter);

export { router };
