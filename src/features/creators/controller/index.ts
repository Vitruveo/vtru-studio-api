import { Router } from 'express';
import { route as coreRouter } from './core';
import { route as loginRouter } from './login';
import { route as connectRouter } from './connect';
import { route as avatarRouter } from './avatar';
import { route as vaultRouter } from './vault';

const router = Router();

router.use('/creators/vault', vaultRouter);
router.use('/creators/avatar', avatarRouter);
router.use('/creators/login', loginRouter);
router.use('/creators/connect', connectRouter);
router.use('/creators', coreRouter);

export { router };
