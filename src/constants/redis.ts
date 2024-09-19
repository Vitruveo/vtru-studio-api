// #region REDIS
export const REDIS_MAIN_CLUSTER = process.env.REDIS_MAIN_CLUSTER
    ? JSON.parse(process.env.REDIS_MAIN_CLUSTER)
    : [{ port: 6379, host: '127.0.0.1' }];
export const REDIS_MAIN_PASSWORD =
    process.env.REDIS_MAIN_PASSWORD || 'password';
export const REDIS_MAIN_IN_CLUSTER = REDIS_MAIN_CLUSTER.length > 1;
// #endregion
