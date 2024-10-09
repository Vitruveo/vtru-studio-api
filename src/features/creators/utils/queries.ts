import { Sort } from 'mongodb';

export const querySortStacks = (sort: string) => {
    let sortQuery: Sort = {};

    switch (sort) {
        case 'latest':
            sortQuery = { 'stacks.createdAt': -1 };
            break;
        case 'titleAZ':
            sortQuery = { 'stacks.title': 1 };
            break;
        case 'titleZA':
            sortQuery = { 'stacks.title': -1 };
            break;
        case 'CuratorAZ':
            sortQuery = { username: 1 };
            break;
        case 'CuratorZA':
            sortQuery = { username: -1 };
            break;
        default:
            sortQuery = { 'stacks.createdAt': -1 };
            break;
    }
    return sortQuery;
};
