import 'dotenv/config';
import debug from 'debug';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import './services/sentry';
import './services/express';
import './services/mongo';
import './services/migration';

dayjs.extend(utc);
dayjs.extend(timezone);

const logger = debug('core');
debug.enable('core:*,services:*,utils:*');

logger('Starting API');
