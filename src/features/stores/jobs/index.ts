import { CronJob } from 'cron';
import { uniqueExecution } from '@nsfilho/unique';

import { spotlight } from './spotlight';

const jobs = [
    new CronJob('0 */3 * * *', spotlight), // every 3 hours
];

export const startJobs = () => {
    jobs.forEach((job) => job.start());
};

export const stopJobs = () => {
    jobs.forEach((job) => job.stop());
};

uniqueExecution({
    name: 'stores jobs',
    callback: async () => {
        await spotlight();

        startJobs();
    },
});
