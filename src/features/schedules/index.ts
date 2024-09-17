import { CronJob } from 'cron';
import debug from 'debug';
import { updateSpotlight } from './updateSpotlight';

const logger = debug('features:schedules');

export const jobs = [new CronJob('0 */3 * * *', updateSpotlight)];

export const start = async () => {
    logger('Starting schedules');
    jobs.forEach((job) => job.start());
};

export const stop = async () => {
    logger('Stopping schedules');
    jobs.forEach((job) => job.stop());
};
