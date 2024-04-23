export const EXPRESS_PORT = process.env.EXPRESS_PORT || 3000;
export const EXPRESS_START_DELAY = process.env.EXPRESS_START_DELAY
    ? parseInt(process.env.EXPRESS_START_DELAY, 10)
    : 15_000;
