import { EventEmitter } from 'stream';

import * as model from '../model';

export const C2PA_SUCCESS = 'c2pa_success';
export const IPFS_SUCCESS = 'ipfs_success';
export const CONSIGN_SUCCESS = 'consign_success';

class Emitter extends EventEmitter {
    emitterC2paSuccess(data: model.Assets['c2pa']) {
        this.emit(C2PA_SUCCESS, data);
    }

    emitterIpfsSuccess(data: model.Assets['ipfs']) {
        this.emit(IPFS_SUCCESS, data);
    }

    emitterConsignSuccess(data: model.Assets['contractExplorer']) {
        this.emit(CONSIGN_SUCCESS, data);
    }
}

const emitter = new Emitter();

export { emitter };
