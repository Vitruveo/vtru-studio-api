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
    {
        'creator.username': {
            $regex: name,
            $options: 'i',
        },
    },
];

export interface querySortSearchParams {
    order: string;
    isIncludeSold: boolean;
}
export const querySortSearch = (
    sort: querySortSearchParams,
    hasBts: boolean
) => {
    let sortQuery: Sort = {};

    switch (sort?.order) {
        case 'priceHighToLow':
            sortQuery = {
                'licenses.nft.single.editionPrice': -1,
                'consignArtwork.listing': -1,
            };
            break;
        case 'priceLowToHigh':
            sortQuery = {
                'licenses.nft.single.editionPrice': 1,
                'consignArtwork.listing': -1,
            };
            break;
        case 'creatorAZ':
            sortQuery = { insensitiveCreator: 1 };
            break;
        case 'creatorZA':
            sortQuery = { insensitiveCreator: -1 };
            break;
        case 'titleAZ':
            sortQuery = { insensitiveTitle: 1 };
            break;
        case 'titleZA':
            sortQuery = { insensitiveTitle: -1 };
            break;
        case 'consignNewToOld':
            sortQuery = { 'consignArtwork.listing': -1 };
            break;
        case 'consignOldToNew':
            sortQuery = { 'consignArtwork.listing': 1 };
            break;
        case 'mintNewToOld':
            sortQuery = { 'mintExplorer.createdAt': -1 };
            break;
        default:
            sortQuery = {
                'consignArtwork.status': 1,
                'consignArtwork.listing': -1,
            };
            break;
    }

    sortQuery = sort?.isIncludeSold
        ? sortQuery
        : { 'licenses.nft.availableLicenses': -1, ...sortQuery };
    sortQuery = hasBts
        ? {
              'mediaAuxiliary.formats.btsVideo': -1,
              'mediaAuxiliary.formats.btsImage': -1,
              ...sortQuery,
          }
        : sortQuery;

    return sortQuery;
};

export const querySortGroupByCreator = (
    sort: querySortSearchParams,
    hasBts: boolean
) => {
    let sortQuery: Sort = {};

    switch (sort?.order) {
        case 'priceHighToLow':
            sortQuery = {
                'asset.licenses.nft.single.editionPrice': -1,
                'consignArtwork.listing': -1,
            };
            break;
        case 'priceLowToHigh':
            sortQuery = {
                'asset.licenses.nft.single.editionPrice': 1,
                'consignArtwork.listing': -1,
            };
            break;
        case 'creatorAZ':
            sortQuery = { insensitiveCreator: 1 };
            break;
        case 'creatorZA':
            sortQuery = { insensitiveCreator: -1 };
            break;
        case 'consignNewToOld':
            sortQuery = { 'asset.consignArtwork.listing': -1 };
            break;
        case 'consignOldToNew':
            sortQuery = { 'asset.consignArtwork.listing': 1 };
            break;
        case 'mintNewToOld':
            sortQuery = { 'asset.mintExplorer.createdAt': -1 };
            break;
        default:
            sortQuery = {
                'asset.consignArtwork.status': 1,
                'asset.consignArtwork.listing': -1,
            };
            break;
    }

    sortQuery = sort?.isIncludeSold
        ? sortQuery
        : { 'asset.licenses.nft.availableLicenses': -1, ...sortQuery };

    sortQuery = hasBts
        ? {
              'asset.mediaAuxiliary.formats.btsVideo': -1,
              'asset.mediaAuxiliary.formats.btsImage': -1,
              ...sortQuery,
          }
        : sortQuery;

    return sortQuery;
};

export const querySortScopeNft = (sort: string) => {
    let sortQuery: Sort = {};

    switch (sort) {
        case 'mintNewToOld':
            sortQuery = { 'mintExplorer.createdAt': -1 };
            break;
        case 'mintOldToNew':
            sortQuery = { 'mintExplorer.createdAt': 1 };
            break;
        case 'creatorAZ':
            sortQuery = { insensitiveCreator: 1 };
            break;
        case 'creatorZA':
            sortQuery = { insensitiveCreator: -1 };
            break;
        case 'titleAZ':
            sortQuery = { insensitiveTitle: 1 };
            break;
        case 'titleZA':
            sortQuery = { insensitiveTitle: -1 };
            break;
        default:
            sortQuery = { 'mintExplorer.createdAt': -1 };
            break;
    }

    return sortQuery;
};

export const querySortStudioCreatorById = (sort: string) => {
    let sortQuery: Sort = {};
    switch (sort) {
        case 'consignNewToOld':
            sortQuery = { 'consignArtwork.listing': -1 };
            break;
        case 'consignOldToNew':
            sortQuery = { 'consignArtwork.listing': 1 };
            break;
        default:
            sortQuery = { 'consignArtwork.listing': -1 };
            break;
    }
    return sortQuery;
};
