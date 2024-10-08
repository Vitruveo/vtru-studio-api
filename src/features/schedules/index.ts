import { CronJob } from 'cron';
import debug from 'debug';
import { updateArtistSpotlight } from './artistSpotlight';
import { updateSpotlight } from './spotlight';

const logger = debug('features:schedules');

export const jobs = [
    new CronJob('0 */3 * * *', updateSpotlight),
    new CronJob('0 */3 * * *', updateArtistSpotlight),
];

export const start = async () => {
    logger('Starting schedules');
    jobs.forEach((job) => job.start());
};

export const stop = async () => {
    logger('Stopping schedules');
    jobs.forEach((job) => job.stop());
};
