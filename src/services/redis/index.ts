import { uniqueExecution } from '@nsfilho/unique';
import debug from 'debug';
import Redis, { Cluster } from 'ioredis';
import {
    REDIS_MAIN_CLUSTER,
    REDIS_MAIN_PASSWORD,
    REDIS_MAIN_IN_CLUSTER,
} from '../../constants';

const logger = debug('services:redis');

interface RedisNodes {
    port: number;
    host: string;
}

export const createRedis = (
    instance: string,
    nodes: RedisNodes[],
    password: string
) => {
    const myInstance =
        nodes.length > 1
            ? new Redis.Cluster(nodes, {
                  redisOptions: {
                      password,
                      family: 4,
                  },

                  lazyConnect: false,
              })
            : new Redis({
                  port: nodes[0].port,
                  host: nodes[0].host,
                  password,
                  family: 4,
              });

    myInstance.on('connect', () => {
        logger('Redis connected.', { instance, label: '@services/redis' });
    });
    myInstance.on('+node', (data) => {
        logger('Redis connected to a node.', {
            instance,
            label: '@services/redis',
            data,
        });
    });
    myInstance.on('error', (error) => {
        logger('Redis failed.', {
            instance,
            label: '@services/redis',
            error,
        });
        process.exit(-1);
    });
    return myInstance;
};

export const redis = createRedis(
    'main',
    REDIS_MAIN_CLUSTER,
    REDIS_MAIN_PASSWORD
);

export const listKeys = async (pattern: string): Promise<string[]> => {
    if (REDIS_MAIN_IN_CLUSTER) {
        const slavesNodes = (redis as Cluster).nodes('slave');
        const list = await Promise.all(slavesNodes.map((n) => n.keys(pattern)));
        return list.flat(1);
    }
    const list = await redis.keys(pattern);
    return list;
};

export const clearCache = async (pattern: string): Promise<number> => {
    const list = await listKeys(pattern);
    if (list.length === 0) return 0;
    if (REDIS_MAIN_IN_CLUSTER) {
        const masterNodes = (redis as Cluster).nodes('master');
        await Promise.all(masterNodes.map((m) => m.del(...list)));
    } else {
        await redis.del(...list);
    }
    return list.length;
};

export const del = async (key: string): Promise<number | number[]> => {
    if (REDIS_MAIN_IN_CLUSTER) {
        const masterNodes = (redis as Cluster).nodes('master');
        return Promise.all(masterNodes.map((m) => m.del(key)));
    }

    return redis.del(key);
};

uniqueExecution({
    name: __filename,
    callback: async () => {
        logger('Redis: starting connections', {
            label: '@services/redis',
        });
    },
});
