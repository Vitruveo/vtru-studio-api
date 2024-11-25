import { uniqueExecution } from '@nsfilho/unique';
import debug from 'debug';

import { startQueueUpdateUsernameInAssets } from './read';

const logger = debug('features:creators:queue');

uniqueExecution({
    name: 'startQueueUpdateUsernameInAssets',
    callback: () =>
        startQueueUpdateUsernameInAssets().catch((error) => {
            logger('Error startQueueUpdateUsernameInAssets', error);
        }),
});
