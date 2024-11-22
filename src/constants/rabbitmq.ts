export const RABBITMQ_URL =
    process.env.RABBITMQ_URL || 'amqp://admin:password@localhost';
export const RABBITMQ_EXCHANGE_EXPRESS =
    process.env.RABBITMQ_EXCHANGE_EXPRESS_LOG || 'express';
export const RABBITMQ_EXCHANGE_MAIL =
    process.env.RABBITMQ_EXCHANGE_MAIL || 'mail';
export const RABBITMQ_EXCHANGE_VIDEO =
    process.env.RABBITMQ_EXCHANGE_VIDEO || 'video';
export const RABBITMQ_EXCHANGE_GRID =
    process.env.RABBITMQ_EXCHANGE_GRID || 'grid';
export const RABBITMQ_EXCHANGE_CREATORS =
    process.env.RABBITMQ_EXCHANGE_CREATORS || 'creators';
export const RABBITMQ_EXCHANGE_RSS = process.env.RABBITMQ_EXCHANGE_RSS || 'rss';
export const RABBITMQ_EXCHANGE_AUTO_CONSIGN =
    process.env.RABBITMQ_EXCHANGE_AUTO_CONSIGN || 'autoConsign';
export const RABBITMQ_ERROR_TIMEOUT_BEFORE_EXIT = process.env
    .RABBITMQ_ERROR_TIMEOUT_BEFORE_EXIT
    ? parseInt(process.env.RABBITMQ_ERROR_TIMEOUT_BEFORE_EXIT, 10)
    : 5000;
export const RABBITMQ_EXCHANGE_UPDATE_USERNAME_IN_ASSETS =
    process.env.RABBITMQ_EXCHANGE_UPDATE_CREATOR_USERNAME_IN_ASSETS ||
    'updateCreatorUsernameInAssets';
