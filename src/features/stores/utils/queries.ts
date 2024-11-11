import { Sort } from 'mongodb';

export const querySorStoreCreatorById = (sort: string) => {
    let sortQuery: Sort = {};
    switch (sort) {
        case 'createdNew':
            sortQuery = { 'framework.createdAt': -1 };
            break;
        case 'createdOld':
            sortQuery = { 'framework.createdAt': 1 };
            break;
        case 'nameAZ':
            sortQuery = { 'framework.name': 1 };
            break;
        case 'nameZA':
            sortQuery = { 'framework.name': -1 };
            break;
        default:
            sortQuery = { 'framework.createdAt': -1 };
            break;
    }
    return sortQuery;
};
