export const LOGIN_CODE_SALT = process.env.LOGIN_CODE_SALT || 'code_salt';
export const JWT_SECRETKEY = process.env.JWT_SECRETKEY || 'jwt_secretkey';
export const TEMPORARY_DIRECTORY =
    process.env.TEMPORARY_DIRECTORY || '/tmp/uploads';

export * from './express';
export * from './sentry';
export * from './rabbitmq';
export * from './mongo';
export * from './login';
export * from './redis';
export * from './shortstack';
export * from './assets';
export * from './ipfs';
export * from './contract';
export * from './aws';
export * from './videoGallery';
export * from './avatar';
export * from './store';
export * from './consign';
export * from './x';
export * from './google';
export * from './search';
export * from './facebook';
export * from './slideshow';
export * from './batch';
