import 'dotenv/config';
import debug from 'debug';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import * as features from './features';
import './services';
import { app } from './services/express';

dayjs.extend(utc);
dayjs.extend(timezone);

const logger = debug('core');

logger('Starting API');

// the unique point of code who knows about all features
app.use(features.users.controller.router);
// app.use(features.roles.controller.router);
