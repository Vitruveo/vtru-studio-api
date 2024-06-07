import { EventEmitter } from 'stream';
import { RequestConsignDocument } from '../model';

class Emitter extends EventEmitter {
    emitCreateRequestConsign = (value: RequestConsignDocument) => {
        this.emit('createRequestConsign', value);
    };
}

const emitter = new Emitter();
export { emitter };
