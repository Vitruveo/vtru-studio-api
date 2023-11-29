export const MONGO_URL =
    process.env.MONGO_URL ||
    'mongodb://root:password@127.0.0.1/platform?authSource=admin';
export const MONGO_DATABASE = process.env.MONGO_DATABASE || 'platform';
export const MIGRATION_COLLECTION_NAME =
    process.env.MIGRATION_COLLECTION_NAME || 'migration';
