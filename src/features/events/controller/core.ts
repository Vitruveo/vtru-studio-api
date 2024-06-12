import debug from 'debug';
import { Router } from 'express';
import { nanoid } from 'nanoid';
import { middleware } from '../../users';
import {
    emitter,
    listDataEvents,
    createdEvents,
    deletedEvents,
    initialEvents,
    updatedEvents,
} from '../emitter';

const logger = debug('features:events:controller');
const route = Router();

route.use(middleware.checkAuth);

route.get('/', async (_req, res) => {
    try {
        res.set('Content-Type', 'text/event-stream');
        res.set('Cache-Control', 'no-cache');
        res.set('Connection', 'keep-alive');
        res.flushHeaders();

        const sendEvent = (data: any, eventType: string) => {
            res.write(`event: ${eventType}\n`);
            res.write(`id: ${nanoid()}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
            return !(res.closed || res.destroyed);
        };

        listDataEvents.forEach((eventType) =>
            emitter.once(eventType, (data: any[]) =>
                data.forEach((item) => sendEvent(item, eventType))
            )
        );

        createdEvents.forEach((eventType) =>
            emitter.on(eventType, (data: any) => sendEvent(data, eventType))
        );

        updatedEvents.forEach((eventType) =>
            emitter.on(eventType, (data: any) => sendEvent(data, eventType))
        );

        deletedEvents.forEach((eventType) =>
            emitter.on(eventType, (data: any) => sendEvent(data, eventType))
        );

        initialEvents.forEach((eventType) => emitter.emit(eventType));

        const removeListeners = () => {
            createdEvents.forEach((eventType) =>
                emitter.removeAllListeners(eventType)
            );
            updatedEvents.forEach((eventType) =>
                emitter.removeAllListeners(eventType)
            );
            deletedEvents.forEach((eventType) =>
                emitter.removeAllListeners(eventType)
            );
        };

        res.on('close', removeListeners);
        res.on('error', removeListeners);
        res.on('finish', removeListeners);
    } catch (error) {
        logger('Find events failed: %O', error);
        res.write(`event: error\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: \n\n`);

        res.end();
    }
});

export { route };
