import { EventEmitter } from 'stream';

class Emitter extends EventEmitter {
    emitCreateRequestConsign = (value: any) => {
        this.emit('createRequestConsign', value);
    };
}

const emitter = new Emitter();
export { emitter };
