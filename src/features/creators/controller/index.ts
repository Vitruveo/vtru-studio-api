import { Router } from 'express';
import { route as coreRouter } from './core';
import { route as loginRouter } from './login';

const router = Router();

router.use('/creators', coreRouter);
router.use('/creators/login', loginRouter);

export { router };
