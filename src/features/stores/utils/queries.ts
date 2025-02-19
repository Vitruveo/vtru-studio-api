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
            sortQuery = { insesitiveName: 1 };
            break;
        case 'nameZA':
            sortQuery = { insesitiveName: -1 };
            break;
        default:
            sortQuery = { 'framework.createdAt': -1 };
            break;
    }
    return sortQuery;
};

export const querySortStores = (sort: string) => {
    let sortQuery: Sort = {};
    switch (sort) {
        case 'newToOld':
            sortQuery = {
                'moderation.createdAt': -1,
                'framework.createdAt': -1,
            };
            break;
        case 'oldToNew':
            sortQuery = { 'moderation.createdAt': 1, 'framework.createdAt': 1 };
            break;
        case 'nameAZ':
            sortQuery = { insensitiveName: 1 };
            break;
        case 'nameZA':
            sortQuery = { insensitiveName: -1 };
            break;
        case 'urlAZ':
            sortQuery = { insensitiveUrl: 1 };
            break;
        case 'urlZA':
            sortQuery = { insensitiveUrl: -1 };
            break;
        default:
            sortQuery = {
                'moderation.createdAt': -1,
                'framework.createdAt': -1,
            };
            break;
    }
    return sortQuery;
};
