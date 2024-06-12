import { EventEmitter } from 'stream';
import { RequestConsignDocument } from '../../requestConsign/model';

class Emitter extends EventEmitter {
    INITIAL_REQUEST_CONSIGNS = 'initialRequestConsigns';

    INITIAL_ASSETS = 'initialAssets';

    INITIAL_USERS = 'initialUsers';

    INITIAL_CREATORS = 'initialCreators';

    INITIAL_WAITING_LIST = 'initialWaitingList';

    INITIAL_ROLES = 'initialRoles';

    INITIAL_ALLOW_LIST = 'initialAllowList';

    LIST_REQUEST_CONSIGNS = 'requestConsigns';

    LIST_ASSETS = 'assets';

    LIST_USERS = 'users';

    LIST_CREATORS = 'creators';

    LIST_WAITING_LIST = 'waitingList';

    LIST_ROLES = 'roles';

    LIST_ALLOW_LIST = 'allowList';

    CREATED_REQUEST_CONSIGN = 'createdRequestConsign';

    CREATED_ASSET = 'createdAsset';

    CREATED_USER = 'createdUser';

    CREATED_CREATOR = 'createdCreator';

    CREATED_WAITING_LIST = 'createdWaitingList';

    CREATED_ROLE = 'createdRole';

    CREATED_ALLOW_LIST = 'createdAllowList';

    UPDATED_REQUEST_CONSIGN = 'updatedRequestConsign';

    UPDATED_ASSET = 'updatedAsset';

    UPDATED_USER = 'updatedUser';

    UPDATED_CREATOR = 'updatedCreator';

    UPDATED_WAITING_LIST = 'updatedWaitingList';

    UPDATED_ROLE = 'updatedRole';

    UPDATED_ALLOW_LIST = 'updatedAllowList';

    DELETED_REQUEST_CONSIGN = 'deletedRequestConsign';

    DELETED_ASSET = 'deletedAsset';

    DELETED_USER = 'deletedUser';

    DELETED_CREATOR = 'deletedCreator';

    DELETED_WAITING_LIST = 'deletedWaitingList';

    DELETED_ROLE = 'deletedRole';

    DELETED_ALLOW_LIST = 'deletedAllowList';

    // REQUEST CONSIGNS EVENTS
    emitCreateRequestConsign = (value: RequestConsignDocument) => {
        this.emit(this.CREATED_REQUEST_CONSIGN, value);
    };

    emitUpdateRequestConsign = (value: RequestConsignDocument) => {
        this.emit(this.UPDATED_REQUEST_CONSIGN, value);
    };

    emitDeleteRequestConsign = (value: string) => {
        this.emit(this.DELETED_REQUEST_CONSIGN, { id: value });
    };

    // ASSETS EVENTS
    emitCreateAsset = (value: any) => {
        this.emit(this.CREATED_ASSET, value);
    };

    emitUpdateAsset = (value: any) => {
        this.emit(this.UPDATED_ASSET, value);
    };

    emitDeleteAsset = (value: string) => {
        this.emit(this.DELETED_ASSET, { id: value });
    };

    // USERS EVENTS
    emitCreateUser = (value: any) => {
        this.emit(this.CREATED_USER, value);
    };

    emitUpdateUser = (value: any) => {
        this.emit(this.UPDATED_USER, value);
    };

    emitDeleteUser = (value: string) => {
        this.emit(this.DELETED_USER, { id: value });
    };

    // CREATORS EVENTS
    emitCreateCreator = (value: any) => {
        this.emit(this.CREATED_CREATOR, value);
    };

    emitUpdateCreator = (value: any) => {
        this.emit(this.UPDATED_CREATOR, value);
    };

    emitDeleteCreator = (value: string) => {
        this.emit(this.DELETED_CREATOR, { id: value });
    };

    // WAITING LIST EVENTS
    emitCreateWaitingList = (value: any) => {
        this.emit(this.CREATED_WAITING_LIST, value);
    };

    emitUpdateWaitingList = (value: any) => {
        this.emit(this.UPDATED_WAITING_LIST, value);
    };

    emitDeleteWaitingList = (value: string) => {
        this.emit(this.DELETED_WAITING_LIST, { id: value });
    };

    // ROLES EVENTS
    emitCreateRole = (value: any) => {
        this.emit(this.CREATED_ROLE, value);
    };

    emitUpdateRole = (value: any) => {
        this.emit(this.UPDATED_ROLE, value);
    };

    emitDeleteRole = (value: string) => {
        this.emit(this.DELETED_ROLE, { id: value });
    };

    // ALLOW LIST EVENTS
    emitCreateAllowList = (value: any) => {
        this.emit(this.CREATED_ALLOW_LIST, value);
    };

    emitUpdateAllowList = (value: any) => {
        this.emit(this.UPDATED_ALLOW_LIST, value);
    };

    emitDeleteAllowList = (value: string) => {
        this.emit(this.DELETED_ALLOW_LIST, { id: value });
    };
}

const emitter = new Emitter();

export const listDataEvents = [
    emitter.LIST_REQUEST_CONSIGNS,
    emitter.LIST_ASSETS,
    emitter.LIST_USERS,
    emitter.LIST_CREATORS,
    emitter.LIST_WAITING_LIST,
    emitter.LIST_ROLES,
    emitter.LIST_ALLOW_LIST,
];

export const initialEvents = [
    emitter.INITIAL_REQUEST_CONSIGNS,
    emitter.INITIAL_ASSETS,
    emitter.INITIAL_USERS,
    emitter.INITIAL_CREATORS,
    emitter.INITIAL_WAITING_LIST,
    emitter.INITIAL_ROLES,
    emitter.INITIAL_ALLOW_LIST,
];

export const createdEvents = [
    emitter.CREATED_ROLE,
    emitter.CREATED_REQUEST_CONSIGN,
    emitter.CREATED_ASSET,
    emitter.CREATED_USER,
    emitter.CREATED_CREATOR,
    emitter.CREATED_WAITING_LIST,
    emitter.CREATED_ALLOW_LIST,
];

export const updatedEvents = [
    emitter.UPDATED_ROLE,
    emitter.UPDATED_REQUEST_CONSIGN,
    emitter.UPDATED_ASSET,
    emitter.UPDATED_USER,
    emitter.UPDATED_CREATOR,
    emitter.UPDATED_WAITING_LIST,
    emitter.UPDATED_ALLOW_LIST,
];

export const deletedEvents = [
    emitter.DELETED_ROLE,
    emitter.DELETED_REQUEST_CONSIGN,
    emitter.DELETED_ASSET,
    emitter.DELETED_USER,
    emitter.DELETED_CREATOR,
    emitter.DELETED_WAITING_LIST,
    emitter.DELETED_ALLOW_LIST,
];
export { emitter };
