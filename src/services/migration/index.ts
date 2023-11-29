import { join } from 'path';
import { lockResource } from '@nsfilho/redis-locker';
import { startMigration } from '@nsfilho/migration';

lockResource({
    resourceName: 'vitruveo.studio.api.migration',
    callback: () =>
        startMigration({
            migrationPath: join(__dirname, '..', '..', 'migrations'),
        }),
});
