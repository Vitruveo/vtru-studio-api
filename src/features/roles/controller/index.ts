import { Router } from 'express';
import { route as coreRouter } from './core';

const router = Router();

router.use('/roles', coreRouter);

export { router };
