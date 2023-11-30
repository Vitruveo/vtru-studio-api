import { join } from 'path';
import debug from 'debug';
import { lockResource } from '@nsfilho/redis-locker';
import { startMigration } from '@nsfilho/migration';
import { captureException } from '../sentry';

const logger = debug('services:migration');

logger('Starting migration');

lockResource({
    resourceName: 'vitruveo.studio.api.migration',
    callback: () =>
        startMigration({
            migrationPath: join(__dirname, '..', '..', 'migrations'),
        }),
}).catch((error) => {
    logger('Error while trying to lock resource: %O', error);
    captureException(error);
    process.exit(1);
});
