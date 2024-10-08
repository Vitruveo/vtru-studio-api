import { CronJob } from 'cron';
import debug from 'debug';
import { clearSpotlight, updateSpotlight } from './spotlight';
import { clearArtistSpotlight, updateArtistSpotlight } from './artistSpotlight';

const logger = debug('features:schedules');

export const jobs = [
    new CronJob('0 */3 * * *', updateSpotlight),
    new CronJob('0 */3 * * *', updateArtistSpotlight),
    new CronJob('0 0 */3 * *', clearSpotlight),
    new CronJob('0 0 */3 * *', clearArtistSpotlight),
];

export const start = async () => {
    logger('Starting schedules');
    jobs.forEach((job) => job.start());
};

export const stop = async () => {
    logger('Stopping schedules');
    jobs.forEach((job) => job.stop());
};
