import { Router } from 'express';
import { route as coreRouter } from './core';
import { route as loginRouter } from './login';

const router = Router();

router.use('/creators/login', loginRouter);
router.use('/creators', coreRouter);

export { router };
