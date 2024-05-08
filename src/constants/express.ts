export const EXPRESS_PORT = process.env.EXPRESS_PORT || 3000;

export const EXPRESS_START_DELAY = process.env.EXPRESS_START_DELAY
    ? parseInt(process.env.EXPRESS_START_DELAY, 10)
    : 15_000;

export const EXPRESS_MULTER_MAX_FILE_SIZE = process.env
    .EXPRESS_MULTER_MAX_FILE_SIZE
    ? parseInt(process.env.EXPRESS_MULTER_MAX_FILE_SIZE, 10)
    : 1024 * 1024 * 10;
