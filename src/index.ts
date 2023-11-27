import os from 'os';
import 'dotenv/config';
import debug from 'debug';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import * as Sentry from '@sentry/node';
import express from 'express';
import morgan from 'morgan';
import { nanoid } from 'nanoid';
import { EXPRESS_PORT, SENTRY_DSN } from './constants';

dayjs.extend(utc);
dayjs.extend(timezone);

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,
        tracesSampleRate: 1.0,
    });
}

const logger = debug('core');
const app = express();

app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
    res.status(200).json({
        server: os.hostname(),
        time: dayjs().toISOString(),
        transaction: nanoid(),
    });
});

app.listen(EXPRESS_PORT, () => {
    logger(`Server listening on port ${EXPRESS_PORT}`);
});
