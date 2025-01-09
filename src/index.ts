/// <reference path="./@types/express.d.ts" />

import 'dotenv/config';
import debug from 'debug';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import './services';
import * as features from './features';
import { app } from './services/express';

dayjs.extend(utc);
dayjs.extend(timezone);

const logger = debug('core');

logger('Starting API');

// the unique point of code who knows about all features.
app.use(features.users.controller.router);
app.use(features.roles.controller.router);
app.use(features.permissions.controller.router);
app.use(features.creators.controller.router);
app.use(features.assets.controller.router);
app.use(features.allowList.controller.router);
app.use(features.waitingList.controller.router);
app.use(features.upload.controller.router);
app.use(features.requestConsign.controller.router);
app.use(features.events.controller.router);
app.use(features.dashboard.controller.router);
app.use(features.stores.controller.router);
app.use(features.templates.controller.router);
app.use(features.features.controller.router);

// start schedules
features.schedules.start();
