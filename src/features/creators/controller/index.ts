import { Router } from 'express';
import { route as coreRouter } from './core';
import { route as loginRouter } from './login';
import { route as notifyRouter } from './notify';

const router = Router();

router.use('/creators/notify', notifyRouter);
router.use('/creators/login', loginRouter);
router.use('/creators', coreRouter);

export { router };
