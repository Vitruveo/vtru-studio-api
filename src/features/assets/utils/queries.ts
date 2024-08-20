import { Sort } from 'mongodb';

export interface QueryByPriceParams {
    min: number;
    max: number;
}
export const queryByPrice = ({ min, max }: QueryByPriceParams) => [
    {
        'licenses.nft.elastic.editionPrice': {
            $gte: min,
            $lte: max,
        },
        'licenses.nft.editionOption': 'elastic',
    },
    {
        'licenses.nft.single.editionPrice': {
            $gte: min,
            $lte: max,
        },
        'licenses.nft.editionOption': 'single',
    },
    {
        'licenses.nft.unlimited.editionPrice': {
            $gte: min,
            $lte: max,
        },
        'licenses.nft.editionOption': 'unlimited',
    },
];

export interface QueryByTitleOrDescOrCreatorParams {
    name: string;
}
export const queryByTitleOrDescOrCreator = ({
    name,
}: QueryByTitleOrDescOrCreatorParams) => [
    {
        'assetMetadata.context.formData.title': {
            $regex: name,
            $options: 'i',
        },
    },
    {
        'assetMetadata.context.formData.description': {
            $regex: name,
            $options: 'i',
        },
    },
    {
        'assetMetadata.creators.formData': {
            $elemMatch: {
                name: {
                    $regex: name,
                    $options: 'i',
                },
            },
        },
    },
];
export interface QuerySortParams {
    order: string;
    isIncludeSold: string;
}
export const querySort = (sort: QuerySortParams) => {
    let sortQuery: Sort = {};

    switch (sort?.order) {
        case 'priceHighToLow':
            sortQuery = {
                'licenses.nft.single.editionPrice': -1,
            };
            break;
        case 'priceLowToHigh':
            sortQuery = {
                'licenses.nft.single.editionPrice': 1,
            };
            break;
        case 'creatorAZ':
            sortQuery = {
                insensitiveCreator: 1,
            };
            break;
        case 'creatorZA':
            sortQuery = {
                insensitiveCreator: -1,
            };
            break;
        case 'consignNewToOld':
            sortQuery = { 'consignArtwork.listing': -1 };
            break;
        case 'consignOldToNew':
            sortQuery = { 'consignArtwork.listing': 1 };
            break;
        default:
            sortQuery = {
                'consignArtwork.status': 1,
                'licenses.nft.availableLicenses': -1,
                'consignArtwork.listing': -1,
            };
            break;
    }

    sortQuery =
        sort?.isIncludeSold === 'true'
            ? sortQuery
            : { 'licenses.nft.availableLicenses': -1, ...sortQuery };
    return sortQuery;
};
