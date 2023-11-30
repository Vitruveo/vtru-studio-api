import { Router } from 'express';
import { route as coreRouter } from './core';
import { route as loginRouter } from './login';

const router = Router();

router.use('/users', coreRouter);
router.use('/users/login', loginRouter);

export { router };
