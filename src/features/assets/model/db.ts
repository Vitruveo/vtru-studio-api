import { AssetsDocument, COLLECTION_ASSETS } from './schema';
import type {
    CreateAssetsParams,
    DeleteAssetsParams,
    FindOneAssetsParams,
    FindAssetsByIdParams,
    FindAssetsParams,
    UpdateAssetsParams,
    UpdateUploadedMediaKeysParams,
    RemoveUploadedMediaKeysParams,
    ReplaceUploadedMediaKeyParams,
    FindAssetsPaginatedParams,
    CountAssetsParams,
    FindAssetsTagsParams,
    FindAssetsCollectionsParams,
    FindAssetsSubjectsParams,
    FindAssetsByCreatorName,
    UpdateManyAssetsStatusParams,
    FindAssetsCarouselParams,
    CountAssetByCreatorIdWithConsignParams,
    UpdateManyAssetsNudityParams,
    FindAssetsGroupPaginatedParams,
    CountAssetsByCreatorIdParams,
    findAssetMintedByAddressParams,
    FindAssetsFromSlideshowParams,
    findAssetsByCreatorIdPaginatedParams,
    FindCollectionsByCreatorParams,
    FindAssetsForSpotlightParams,
    UpdateManyAssetSpotlightParams,
    FindMyAssetsParams,
    CountArtsByCreatorParams,
    UpateAssetsUsernameParams,
    CountAssetsWithLicenseArtCardsByCreatorParams,
    FindAssetsWithArtCardsPaginatedParams,
    UpdateAssetArtCardsStatusParams,
    CountAssetsWithLicenseArtCardsParams,
    FindLastConsignsParams,
    UpdateManyAssetsAutoStakeParams,
    FindLastSoldAssets,
    StoresVisibilityParams,
    FindAssetsForStorePackParams,
    FindAssetsTagsSearchableParams,
} from './types';
import { FindOptions, getDb, ObjectId } from '../../../services/mongo';
import { buildFilterColorsQuery } from '../utils/color';
import { ASSET_STORAGE_URL, STORE_URL } from '../../../constants';

const assets = () => getDb().collection<AssetsDocument>(COLLECTION_ASSETS);

// basic actions.
export const createAssets = async ({ asset }: CreateAssetsParams) => {
    const result = await assets().insertOne(asset);
    return result;
};

export const countAssetsGroup = async ({
    query,
    grouped,
}: CountAssetsByCreatorIdParams) =>
    assets()
        .aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$framework.createdBy',
                    count: {
                        $sum: 1,
                    },
                    countWithSold: {
                        $sum: {
                            $cond: [
                                { $ifNull: ['$mintExplorer', false] },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
            {
                $match: {
                    ...(grouped === 'noSales'
                        ? { countWithSold: 0 }
                        : { countWithSold: { $gte: 0 } }),
                },
            },
        ])
        .toArray();

export const findAssetGroupPaginated = ({
    query,
    skip,
    limit,
    sort,
    grouped,
}: FindAssetsGroupPaginatedParams) => {
    const aggregate = [
        { $match: query },
        {
            $group: {
                _id: '$framework.createdBy',
                count: { $sum: 1 },
                countWithSold: {
                    $sum: {
                        $cond: [{ $ifNull: ['$mintExplorer', false] }, 1, 0],
                    },
                },
            },
        },
        {
            $match: {
                ...(grouped === 'noSales'
                    ? { countWithSold: 0 }
                    : { countWithSold: { $gte: 0 } }),
            },
        },
        {
            $lookup: {
                from: 'assets',
                let: { creatorId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$framework.createdBy', '$$creatorId'],
                            },
                            ...query,
                        },
                    },
                    {
                        $addFields: {
                            'licenses.nft.availableLicenses': {
                                $ifNull: ['$licenses.nft.availableLicenses', 1],
                            },
                        },
                    },
                    {
                        $project: {
                            paths: {
                                $cond: {
                                    if: {
                                        $isArray: '$formats.preview.path',
                                    },
                                    then: '$formats.preview.path',
                                    else: {
                                        $ifNull: [
                                            ['$formats.preview.path'],
                                            [],
                                        ],
                                    },
                                },
                            },
                            assetData: '$$ROOT',
                        },
                    },
                ],
                as: 'assetsWithPaths',
            },
        },
        {
            $addFields: {
                paths: {
                    $slice: [
                        {
                            $reduce: {
                                input: '$assetsWithPaths',
                                initialValue: [],
                                in: {
                                    $concatArrays: ['$$value', '$$this.paths'],
                                },
                            },
                        },
                        5,
                    ],
                },
                asset: {
                    $let: {
                        vars: {
                            filteredAssets: {
                                $filter: {
                                    input: '$assetsWithPaths.assetData',
                                    as: 'asset',
                                    cond: {
                                        $not: [
                                            {
                                                $ifNull: [
                                                    '$$asset.mintExplorer',
                                                    false,
                                                ],
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        in: {
                            $cond: {
                                if: {
                                    $gt: [{ $size: '$$filteredAssets' }, 0],
                                },
                                then: { $last: '$$filteredAssets' },
                                else: {
                                    $first: '$assetsWithPaths.assetData',
                                },
                            },
                        },
                    },
                },
            },
        },
        {
            $addFields: {
                creatorId: {
                    $toObjectId: '$asset.framework.createdBy',
                },
            },
        },
        {
            $lookup: {
                from: 'creators',
                localField: 'creatorId',
                foreignField: '_id',
                as: 'creator',
            },
        },
        {
            $unwind: {
                path: '$creator',
            },
        },
        {
            $addFields: {
                vault: '$creator.vault',
                insensitiveCreator: {
                    $toLower: '$creator.username',
                },
            },
        },
        {
            $project: {
                assetsWithPaths: 0,
                countWithSold: 0,
                creatorId: 0,
                creator: 0,
                paths: 0,
                vault: 0,
                'asset.actions': 0,
                'asset.c2pa': 0,
                'asset.ipfs': 0,
                'asset.mediaAuxiliary': 0,
                'asset.status': 0,
                'asset.terms': 0,
                'asset.contractExplorer': 0,
                'asset.uploadedMediaKeys': 0,
                'asset.assetMetadata.isCompleted': 0,
                'asset.assetMetadata.context.formData.colors': 0,
                'asset.assetMetadata.context.formData.culture': 0,
                'asset.assetMetadata.context.formData.mood': 0,
                'asset.assetMetadata.context.formData.orientation': 0,
                'asset.assetMetadata.creators': 0,
                'asset.assetMetadata.provenance': 0,
                'asset.assetMetadata.taxonomy': 0,
                'formats.original.name': 0,
                'formats.original.path': 0,
                'formats.original.size': 0,
                'formats.original.width': 0,
                'formats.original.height': 0,
                'formats.original.validation': 0,
                'asset.formats.exhibition': 0,
                'asset.formats.display': 0,
                'asset.formats.print': 0,
                'asset.formats.preview.validation': 0,
                'asset.formats.preview.size': 0,
                'formats.preview.name': 0,
                'asset.licenses.print': 0,
                'asset.licenses.remix': 0,
                'asset.licenses.stream': 0,
                'asset.licenses.nft.elastic': 0,
                'asset.licenses.nft.license': 0,
                'asset.licenses.nft.unlimited': 0,
                'asset.licenses.nft.version': 0,
                'asset.licenses.nft.added': 0,
            },
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
    ];

    return assets().aggregate(aggregate).toArray();
};

export const findAssetsPaginated = ({
    query,
    skip,
    limit,
    colors,
    precision,
    sort,
}: FindAssetsPaginatedParams) => {
    const aggregate = [
        { $match: query },
        {
            $addFields: {
                'licenses.nft.availableLicenses': {
                    $ifNull: ['$licenses.nft.availableLicenses', 1],
                },
                'assetMetadata.context.formData.colors': {
                    $ifNull: ['$assetMetadata.context.formData.colors', []],
                },
                insensitiveCreator: {
                    $cond: {
                        if: {
                            $isArray: '$assetMetadata.creators.formData.name',
                        },
                        then: {
                            $map: {
                                input: '$assetMetadata.creators.formData.name',
                                as: 'n',
                                in: { $toLower: '$$n' },
                            },
                        },
                        else: {
                            $toLower: '$assetMetadata.creators.formData.name',
                        },
                    },
                },
                insensitiveTitle: {
                    $toLower: '$assetMetadata.context.formData.title',
                },
                exists: {
                    $cond: {
                        if: {
                            $gt: [colors?.length, 0],
                        },
                        then: {
                            $anyElementTrue: {
                                $map: {
                                    input: '$assetMetadata.context.formData.colors',
                                    as: 'colors',
                                    in: {
                                        $or: buildFilterColorsQuery(
                                            colors!,
                                            precision
                                        ),
                                    },
                                },
                            },
                        },
                        else: {
                            $literal: true,
                        },
                    },
                },
            },
        },
        {
            $match: {
                exists: true,
            },
        },
        {
            $addFields: {
                creatorId: {
                    $toObjectId: '$framework.createdBy',
                },
            },
        },
        {
            $lookup: {
                from: 'creators',
                localField: 'creatorId',
                foreignField: '_id',
                as: 'creatorDetails',
            },
        },
        {
            $unwind: {
                path: '$creatorDetails',
            },
        },
        {
            $addFields: {
                vault: '$creatorDetails.vault',
            },
        },
        {
            $project: {
                creatorId: 0,
                creatorDetails: 0,
                actions: 0,
                c2pa: 0,
                contractExplorer: 0,
                exists: 0,
                insensitiveCreator: 0,
                insensitiveTitle: 0,
                ipfs: 0,
                mediaAuxiliary: 0,
                status: 0,
                terms: 0,
                uploadedMediaKeys: 0,
                vault: 0,
                'assetMetadata.isCompleted': 0,
                'assetMetadata.context.formData.colors': 0,
                'assetMetadata.context.formData.culture': 0,
                'assetMetadata.context.formData.mood': 0,
                'assetMetadata.context.formData.orientation': 0,
                'assetMetadata.provenance': 0,
                'assetMetadata.taxonomy': 0,
                'formats.original.name': 0,
                'formats.original.path': 0,
                'formats.original.size': 0,
                'formats.original.width': 0,
                'formats.original.height': 0,
                'formats.original.validation': 0,
                'formats.exhibition': 0,
                'formats.display': 0,
                'formats.print': 0,
                'formats.preview.validation': 0,
                'formats.preview.size': 0,
                'formats.preview.name': 0,
                'licenses.print': 0,
                'licenses.remix': 0,
                'licenses.stream': 0,
                'licenses.nft.elastic': 0,
                'licenses.nft.license': 0,
                'licenses.nft.unlimited': 0,
                'licenses.nft.version': 0,
                'licenses.nft.added': 0,
            },
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
    ];

    return assets().aggregate(aggregate).toArray();
};

export const findAssetsByCreatorIdPaginated = ({
    query,
    skip,
    limit,
    sort,
}: findAssetsByCreatorIdPaginatedParams) =>
    assets()
        .aggregate([
            { $match: query },
            {
                $addFields: {
                    assetId: { $toString: '$_id' },
                },
            },
            {
                $lookup: {
                    from: 'requestConsigns',
                    localField: 'assetId',
                    foreignField: 'asset',
                    as: 'request',
                },
            },
            {
                $unwind: {
                    path: '$request',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    countComments: {
                        $cond: {
                            if: {
                                $gt: [{ $type: '$request' }, 'missing'],
                            },
                            then: {
                                $size: {
                                    $filter: {
                                        input: {
                                            $ifNull: ['$request.comments', []],
                                        },
                                        as: 'item',
                                        cond: {
                                            $eq: ['$$item.isPublic', true],
                                        },
                                    },
                                },
                            },
                            else: 0,
                        },
                    },
                },
            },
            {
                $project: {
                    request: 0,
                    assetId: 0,
                },
            },
            { $sort: sort },
            { $skip: skip },
            { $limit: limit },
        ])
        .toArray();

export const findMaxPrice = () =>
    assets()
        .aggregate([
            {
                $project: {
                    maxPrice: {
                        $max: [
                            {
                                $cond: {
                                    if: {
                                        $eq: [
                                            '$licenses.nft.editionOption',
                                            'elastic',
                                        ],
                                    },
                                    then: '$licenses.nft.elastic.editionPrice',
                                    else: 0,
                                },
                            },
                            {
                                $cond: {
                                    if: {
                                        $eq: [
                                            '$licenses.nft.editionOption',
                                            'single',
                                        ],
                                    },
                                    then: '$licenses.nft.single.editionPrice',
                                    else: 0,
                                },
                            },
                            {
                                $cond: {
                                    if: {
                                        $eq: [
                                            '$licenses.nft.editionOption',
                                            'unlimited',
                                        ],
                                    },
                                    then: '$licenses.nft.unlimited.editionPrice',
                                    else: 0,
                                },
                            },
                        ],
                    },
                },
            },
            { $sort: { maxPrice: -1 } },
            { $limit: 1 },
        ])
        .toArray()
        .then((result) => (result.length > 0 ? result[0].maxPrice : null));

export const countAssets = async ({
    query,
    colors,
    precision,
}: CountAssetsParams) => {
    const aggregate = [
        {
            $match: query,
        },
        {
            $addFields: {
                'licenses.nft.availableLicenses': {
                    $ifNull: ['$licenses.nft.availableLicenses', 1],
                },
                'assetMetadata.context.formData.colors': {
                    $ifNull: ['$assetMetadata.context.formData.colors', []],
                },
                exists: {
                    $cond: {
                        if: {
                            $gt: [colors?.length, 0],
                        },
                        then: {
                            $anyElementTrue: {
                                $map: {
                                    input: '$assetMetadata.context.formData.colors',
                                    as: 'colors',
                                    in: {
                                        $or: buildFilterColorsQuery(
                                            colors!,
                                            precision
                                        ),
                                    },
                                },
                            },
                        },
                        else: {
                            $literal: true,
                        },
                    },
                },
            },
        },
        {
            $match: {
                exists: true,
            },
        },
        {
            $group: {
                _id: null,
                count: { $sum: 1 },
            },
        },
    ];
    return assets().aggregate(aggregate).toArray() as Promise<
        [{ count?: number }]
    >;
};

export const countAssetsWithLicenseArtCardsByCreator = async ({
    creatorId,
}: CountAssetsWithLicenseArtCardsByCreatorParams) =>
    assets().countDocuments({
        'framework.createdBy': creatorId,
        'licenses.artCards.added': true,
    });

export const findCollectionsByCreatorId = async ({
    creatorId,
}: FindCollectionsByCreatorParams) =>
    assets()
        .aggregate([
            {
                $match: {
                    'framework.createdBy': creatorId,
                },
            },
            {
                $unwind: '$assetMetadata.taxonomy.formData.collections',
            },
            {
                $group: {
                    _id: {
                        $trim: {
                            input: '$assetMetadata.taxonomy.formData.collections',
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    collection: '$_id',
                },
            },
        ])
        .toArray();

export const findAssetsCollections = ({
    name,
    showAdditionalAssets,
}: FindAssetsCollectionsParams) =>
    assets()
        .aggregate([
            {
                $unwind: '$assetMetadata.taxonomy.formData.collections',
            },
            {
                $match: {
                    'assetMetadata.taxonomy.formData.collections': {
                        $regex: new RegExp(`(^| )${name}`, 'i'),
                    },
                    ...(showAdditionalAssets === 'true'
                        ? {}
                        : { 'consignArtwork.status': 'active' }),
                },
            },
            {
                $group: {
                    _id: {
                        $toLower: {
                            $trim: {
                                input: '$assetMetadata.taxonomy.formData.collections',
                            },
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    collection: '$_id',
                    count: 1,
                },
            },
            { $sort: { count: -1, collection: 1 } },
        ])
        .toArray();

export const findAssetsSubjects = ({
    name,
    showAdditionalAssets,
}: FindAssetsSubjectsParams) =>
    assets()
        .aggregate([
            { $unwind: '$assetMetadata.taxonomy.formData.subject' },
            {
                $match: {
                    'assetMetadata.taxonomy.formData.subject': {
                        $regex: new RegExp(`(^| )${name}`, 'i'),
                    },
                    ...(showAdditionalAssets === 'true'
                        ? {}
                        : { 'consignArtwork.status': 'active' }),
                },
            },
            {
                $group: {
                    _id: {
                        $toLower: {
                            $trim: {
                                input: '$assetMetadata.taxonomy.formData.subject',
                            },
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    subject: '$_id',
                    count: 1,
                },
            },
            { $sort: { count: -1, subject: 1 } },
        ])
        .toArray();

export const findAssetsTags = async ({ query }: FindAssetsTagsParams) =>
    assets()
        .aggregate([
            { $match: query },
            { $unwind: '$assetMetadata.taxonomy.formData.tags' },
            {
                $group: {
                    _id: {
                        $trim: {
                            input: '$assetMetadata.taxonomy.formData.tags',
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    tag: '$_id',
                    count: 1,
                },
            },
        ])
        .toArray();

export const findAssetsTagsSearchable = async ({
    name,
    limit,
    showAdditionalAssets,
}: FindAssetsTagsSearchableParams) => {
    const stages: Record<string, any>[] = [];

    if (name) {
        stages.push({
            'assetMetadata.taxonomy.formData.tags': {
                $regex: new RegExp(`(^| )${name}`, 'i'),
            },
        });
    }
    if (!showAdditionalAssets) {
        stages.push({
            'consignArtwork.status': 'active',
        });
    }

    return assets()
        .aggregate([
            { $unwind: '$assetMetadata.taxonomy.formData.tags' },
            {
                $match: stages.reduce(
                    (acc, cur) => ({
                        ...acc,
                        ...cur,
                    }),
                    {}
                ),
            },
            {
                $group: {
                    _id: {
                        $toLower: {
                            $trim: {
                                input: '$assetMetadata.taxonomy.formData.tags',
                            },
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    tag: '$_id',
                    count: 1,
                },
            },
            { $sort: { count: -1, tag: 1 } },
            { $limit: limit || 10 },
        ])
        .toArray();
};

export const findAssetsByCreatorName = ({
    name,
    showAdditionalAssets,
}: FindAssetsByCreatorName) =>
    assets()
        .aggregate([
            { $unwind: '$assetMetadata.creators.formData' },
            {
                $match: {
                    'assetMetadata.creators.formData.name': {
                        $regex: new RegExp(`(^| )${name}`, 'i'),
                    },
                    ...(showAdditionalAssets === 'true'
                        ? {}
                        : { 'consignArtwork.status': 'active' }),
                },
            },
            {
                $addFields: {
                    insensitiveCreator: {
                        $cond: {
                            if: {
                                $isArray:
                                    '$assetMetadata.creators.formData.name',
                            },
                            then: {
                                $map: {
                                    input: '$assetMetadata.creators.formData.name',
                                    as: 'n',
                                    in: { $toLower: '$$n' },
                                },
                            },
                            else: {
                                $toLower:
                                    '$assetMetadata.creators.formData.name',
                            },
                        },
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $trim: {
                            input: '$insensitiveCreator',
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    collection: '$_id',
                    count: 1,
                },
            },
            { $sort: { count: -1, collection: 1 } },
        ])
        .toArray();

export const findAssetsByIdFull = async ({ id }: FindAssetsByIdParams) =>
    assets().findOne({ _id: new ObjectId(id) });

export const findAssetsById = async ({ id }: FindAssetsByIdParams) =>
    assets().findOne(
        { _id: new ObjectId(id) },
        {
            projection: {
                actions: 0,
                status: 0,
                terms: 0,
                uploadedMediaKeys: 0,
                c2pa: 0,
                ipfs: 0,
                'assetMetadata.isCompleted': 0,
                'contractExplorer.assetId': 0,
                'contractExplorer.assetRefId': 0,
                'contractExplorer.blockNumber': 0,
                'contractExplorer.contractAddress': 0,
                'contractExplorer.createdAt': 0,
                'contractExplorer.creatorRefId': 0,
                'contractExplorer.licenses': 0,
                'contractExplorer.tx': 0,
                'formats.display.size': 0,
                'formats.exhibition.size': 0,
                'formats.preview.size': 0,
                'formats.original.size': 0,
                'formats.original.width': 0,
                'formats.original.height': 0,
                'licenses.print': 0,
                'licenses.remix': 0,
                'licenses.stream': 0,
                'licenses.nft.elastic': 0,
                'licenses.nft.license': 0,
                'licenses.nft.unlimited': 0,
                'licenses.nft.version': 0,
                'licenses.nft.added': 0,
            },
        }
    );

export const findLastConsigns = async ({
    id,
    creatorId,
}: FindLastConsignsParams) =>
    assets()
        .aggregate([
            {
                $match: {
                    _id: { $ne: new ObjectId(id) },
                    'consignArtwork.status': 'active',
                    'framework.createdBy': creatorId,
                    mintExplorer: { $exists: false },
                },
            },
            { $sort: { 'consignArtwork.createdAt': -1 } },
            { $limit: 5 },
            {
                $project: {
                    path: '$formats.preview.path',
                },
            },
        ])
        .toArray();

export const countAssetsWithLicenseArtCards = async ({
    status,
}: CountAssetsWithLicenseArtCardsParams) =>
    assets().countDocuments({
        'licenses.artCards.added': true,
        'licenses.artCards.status': status,
    });

export const findAssetsWithArtCardsPaginated = ({
    limit,
    query,
    skip,
    sort,
}: FindAssetsWithArtCardsPaginatedParams) =>
    assets()
        .aggregate([
            {
                $match: {
                    'licenses.artCards.added': true,
                    'licenses.artCards.status': query.status,
                },
            },
            {
                $match: {
                    $or: [
                        {
                            'assetMetadata.context.formData.title': {
                                $regex: query.search ?? '.*',
                                $options: 'i',
                            },
                        },
                        {
                            'creator.username': {
                                $regex: query.search ?? '.*',
                                $options: 'i',
                            },
                        },
                    ],
                },
            },
            { $sort: sort },
            { $skip: skip },
            { $limit: limit },
        ])
        .toArray();

export const updateAssetArtCardsStatus = ({
    id,
    status,
}: UpdateAssetArtCardsStatusParams) =>
    assets().updateOne(
        { _id: new ObjectId(id) },
        { $set: { 'licenses.artCards.status': status } }
    );

export const findAssetMintedByAddress = async ({
    address,
    sort,
}: findAssetMintedByAddressParams) =>
    assets()
        .aggregate([
            {
                $match: {
                    'mintExplorer.address': address,
                    'framework.createdBy': { $exists: true, $ne: '' },
                },
            },
            {
                $addFields: {
                    creatorId: {
                        $toObjectId: '$framework.createdBy',
                    },
                    insensitiveCreator: {
                        $cond: {
                            if: {
                                $isArray:
                                    '$assetMetadata.creators.formData.name',
                            },
                            then: {
                                $map: {
                                    input: '$assetMetadata.creators.formData.name',
                                    as: 'name',
                                    in: { $toLower: '$$name' },
                                },
                            },
                            else: {
                                $toLower:
                                    '$assetMetadata.creators.formData.name',
                            },
                        },
                    },
                    insensitiveTitle: {
                        $toLower: '$assetMetadata.context.formData.title',
                    },
                },
            },
            { $sort: sort },
            {
                $lookup: {
                    from: 'creators',
                    localField: 'creatorId',
                    foreignField: '_id',
                    as: 'creator',
                },
            },
            {
                $unwind: {
                    path: '$creator',
                },
            },
            {
                $project: {
                    storeUrl: {
                        $concat: [
                            STORE_URL,
                            '/',
                            '$creator.username',
                            '/',
                            '$consignArtwork.assetKey',
                        ],
                    },
                    previewUrl: {
                        $concat: [
                            ASSET_STORAGE_URL,
                            '/',
                            '$formats.preview.path',
                        ],
                    },
                },
            },
        ])
        .toArray();

export const countAssetsByCreator = ({ query }: CountAssetsByCreatorIdParams) =>
    assets().countDocuments(query);

export const findAssetsByCreatorId = async ({ id }: FindAssetsByIdParams) =>
    assets()
        .aggregate([
            {
                $match: {
                    'framework.createdBy': id,
                },
            },
            {
                $addFields: {
                    assetId: { $toString: '$_id' },
                },
            },
            {
                $lookup: {
                    from: 'requestConsigns',
                    localField: 'assetId',
                    foreignField: 'asset',
                    as: 'request',
                },
            },
            {
                $unwind: {
                    path: '$request',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    countComments: {
                        $cond: {
                            if: {
                                $gt: [{ $type: '$request' }, 'missing'],
                            },
                            then: {
                                $size: {
                                    $filter: {
                                        input: {
                                            $ifNull: ['$request.comments', []],
                                        },
                                        as: 'item',
                                        cond: {
                                            $eq: ['$$item.isPublic', true],
                                        },
                                    },
                                },
                            },
                            else: 0,
                        },
                    },
                },
            },
            {
                $project: {
                    request: 0,
                    assetId: 0,
                },
            },
        ])
        .toArray();

export const findAssetCreatedBy = async ({ id }: FindAssetsByIdParams) => {
    const result = await assets().findOne({
        'framework.createdBy': id,
    });
    return result;
};

export const findMyAssets = async ({ query }: FindMyAssetsParams) => {
    const result = await assets().find(query).toArray();
    return result;
};

export const findOneAssets = async ({ query }: FindOneAssetsParams) => {
    const result = await assets().findOne<AssetsDocument>(query);
    return result;
};

export const updateAssets = async ({ id, asset }: UpdateAssetsParams) => {
    const result = await assets().updateOne(
        { _id: new ObjectId(id) },
        { $set: asset }
    );
    return result;
};

export const updateManyAssetsNudity = ({
    ids,
    nudity,
}: UpdateManyAssetsNudityParams) =>
    assets().updateMany(
        { _id: { $in: ids.map((id) => new ObjectId(id)) } },
        {
            $set: {
                'assetMetadata.taxonomy.formData.nudity': nudity ? 'yes' : 'no',
            },
        }
    );

export const updateManyAssetsStatus = async ({
    ids,
    status,
}: UpdateManyAssetsStatusParams) => {
    const result = await assets().updateMany(
        { _id: { $in: ids.map((id) => new ObjectId(id)) } },
        { $set: { 'consignArtwork.status': status } }
    );
    return result;
};

export const updateStoresVisibility = async ({
    id,
    stores,
}: StoresVisibilityParams) => {
    const result = await assets().updateOne(
        { _id: new ObjectId(id) },
        { $set: { stores } }
    );
    return result;
};

export const updateManyAssetsAutoStake = async ({
    creatorId,
    autoStake,
}: UpdateManyAssetsAutoStakeParams) => {
    const result = await assets().updateMany(
        { 'framework.createdBy': creatorId },
        { $set: { 'licenses.nft.autoStake': autoStake } }
    );
    return result;
};

export const findAssetsByPath = ({
    path,
    query,
    options,
}: {
    path: string;
    query: Record<string, any>;
    options?: FindOptions;
}) =>
    assets()
        .find({ [path]: query }, options)
        .toArray();

export const findAssetsCodeZipByPath = async ({ path }: { path: string }) => {
    const result = await assets().findOne({
        'mediaAuxiliary.formats.codeZip.path': path,
    });

    return result;
};

export const deleteAssets = async ({ id }: DeleteAssetsParams) => {
    const result = await assets().deleteOne({ _id: new ObjectId(id) });
    return result;
};

export const updateUploadedMediaKeys = async ({
    id,
    mediaKey,
}: UpdateUploadedMediaKeysParams) => {
    const result = await assets().updateOne(
        { _id: new ObjectId(id) },
        { $push: { uploadedMediaKeys: mediaKey } }
    );
    return result;
};

export const replaceAsset = (id: string, asset: AssetsDocument) =>
    assets().replaceOne({ _id: new ObjectId(id) }, asset);

export const replaceUploadedMediaKey = async ({
    id,
    oldMediaKey,
    newMediaKey,
}: ReplaceUploadedMediaKeyParams) => {
    await assets().updateOne(
        { _id: new ObjectId(id) },
        { $pull: { uploadedMediaKeys: oldMediaKey } }
    );

    const result = await assets().updateOne(
        { _id: new ObjectId(id) },
        { $push: { uploadedMediaKeys: newMediaKey } }
    );
    return result;
};

export const removeUploadedMediaKeys = async ({
    id,
    mediaKeys,
}: RemoveUploadedMediaKeysParams) => {
    const result = await assets().updateOne(
        { _id: new ObjectId(id) },
        { $pullAll: { uploadedMediaKeys: mediaKeys } }
    );
    return result;
};

export const findLastSoldAssets = ({ query }: FindLastSoldAssets) =>
    assets()
        .aggregate([
            {
                $match: {
                    ...query,
                    mintExplorer: { $exists: true },
                    'assetMetadata.taxonomy.formData.nudity': 'no',
                    'consignArtwork.status': 'active',
                },
            },
            { $sort: { 'mintExplorer.createdAt': -1 } },
            { $limit: 50 },
            {
                $addFields: {
                    creatorId: {
                        $toObjectId: '$framework.createdBy',
                    },
                },
            },
            {
                $lookup: {
                    from: 'creators',
                    localField: 'creatorId',
                    foreignField: '_id',
                    as: 'creator',
                },
            },
            {
                $unwind: {
                    path: '$creator',
                },
            },
            {
                $project: {
                    _id: '$_id',
                    title: '$assetMetadata.context.formData.title',
                    preview: '$formats.preview.path',
                    price: '$licenses.nft.single.editionPrice',
                    username: '$creator.username',
                    vault: '$creator.vault',
                    framework: '$framework',
                },
            },
        ])
        .toArray();

export const findAssetsCarousel = ({
    layout,
    nudity,
}: FindAssetsCarouselParams) =>
    assets()
        .aggregate([
            {
                $addFields: {
                    randomField: { $rand: {} },
                    createdBy: {
                        $toObjectId: '$framework.createdBy',
                    },
                },
            },
            {
                $lookup: {
                    from: 'creators',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'creatorInformation',
                },
            },
            {
                $unwind: '$creatorInformation',
            },
            {
                $match: {
                    'consignArtwork.status': 'active',
                    'contractExplorer.explorer': {
                        $exists: true,
                    },
                    'licenses.nft.added': true,
                    'formats.display.path': {
                        $exists: true,
                        $ne: null,
                    },
                    creatorInformation: {
                        $exists: true,
                    },
                    'assetMetadata.context.formData.orientation':
                        layout ?? 'horizontal',
                    'assetMetadata.taxonomy.formData.nudity': nudity ?? 'no',
                },
            },
            {
                $sort: {
                    randomField: 1,
                },
            },
            {
                $project: {
                    asset: {
                        image: '$formats.display.path',
                        title: '$assetMetadata.context.formData.title',
                        description:
                            '$assetMetadata.context.formData.description',
                    },
                    creator: {
                        avatar: '$creatorInformation.profile.avatar',
                        username: '$creatorInformation.username',
                    },
                },
            },
        ])
        .toArray();

export const countAssetConsignedByCreator = ({
    creatorId,
}: CountAssetByCreatorIdWithConsignParams) =>
    assets().countDocuments({
        contractExplorer: { $exists: true },
        'consignArtwork.status': 'active',
        'framework.createdBy': creatorId,
    });

export const findAssetsFromSlideshow = ({
    query,
}: FindAssetsFromSlideshowParams) =>
    assets()
        .aggregate([
            { $match: query },
            {
                $addFields: {
                    createdBy: {
                        $toObjectId: '$framework.createdBy',
                    },
                },
            },
            {
                $lookup: {
                    from: 'creators',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'creator',
                },
            },
            {
                $unwind: {
                    path: '$creator',
                },
            },
            {
                $project: {
                    title: '$assetMetadata.context.formData.title',
                    image: '$formats.exhibition.path',
                    orientation: '$assetMetadata.context.formData.orientation',
                    username: '$creator.username',
                    avatar: '$creator.profile.avatar',
                },
            },
        ])
        .toArray();

export const findAssetsForSpotlight = ({
    query,
    limit,
}: FindAssetsForSpotlightParams) =>
    assets()
        .aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$framework.createdBy',
                    asset: { $first: '$$ROOT' },
                },
            },
            { $limit: limit },
            {
                $addFields: {
                    createdBy: {
                        $toObjectId: '$asset.framework.createdBy',
                    },
                },
            },
            {
                $lookup: {
                    from: 'creators',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'creator',
                },
            },
            {
                $unwind: {
                    path: '$creator',
                },
            },
            {
                $project: {
                    _id: '$asset._id',
                    title: '$asset.assetMetadata.context.formData.title',
                    price: '$asset.licenses.nft.single.editionPrice',
                    preview: '$asset.formats.preview.path',
                    username: '$creator.username',
                    nudity: '$asset.assetMetadata.taxonomy.formData.nudity',
                    vault: '$creator.vault',
                },
            },
        ])
        .toArray();

export const updateManyAssetSpotlight = async ({
    ids,
}: UpdateManyAssetSpotlightParams) =>
    assets().updateMany(
        { _id: { $in: ids.map((id) => new ObjectId(id)) } },
        { $set: { 'actions.displaySpotlight': true } }
    );

export const updateManyAssetSpotlightClear = async () =>
    assets().updateMany(
        { 'actions.displaySpotlight': { $exists: true } },
        { $unset: { 'actions.displaySpotlight': '' } }
    );

export const countAllAssets = async (query = {}) =>
    assets().countDocuments(query);

export const getTotalPrice = async (query = {}) =>
    assets()
        .aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalPrice: { $sum: '$licenses.nft.single.editionPrice' },
                },
            },
        ])
        .toArray()
        .then((result) => (result.length > 0 ? result[0].totalPrice : 0));

export const countArtsByCreator = async ({ query }: CountArtsByCreatorParams) =>
    assets().countDocuments(query);

export const updateAssetsUsername = async ({
    data,
    username,
}: UpateAssetsUsernameParams) =>
    assets().updateMany(
        { _id: { $in: data.map((item) => new ObjectId(item._id)) } },
        { $set: { 'creator.username': username } }
    );

export const findAssets = async ({ query }: FindAssetsParams) =>
    assets().find(query).toArray();

export const findAssetsForStorePack = async ({
    query,
}: FindAssetsForStorePackParams) => {
    const aggregate = [
        { $match: query },
        {
            $addFields: {
                creatorId: {
                    $toObjectId: '$framework.createdBy',
                },
            },
        },
        {
            $lookup: {
                from: 'creators',
                localField: 'creatorId',
                foreignField: '_id',
                as: 'creatorDetails',
            },
        },
        {
            $unwind: {
                path: '$creatorDetails',
            },
        },
        {
            $addFields: {
                vault: '$creatorDetails.vault',
                'creator.avatar': '$creatorDetails.profile.avatar',
            },
        },
        {
            $project: {
                creatorId: 0,
                creatorDetails: 0,
                actions: 0,
                c2pa: 0,
                contractExplorer: 0,
                exists: 0,
                insensitiveCreator: 0,
                insensitiveTitle: 0,
                ipfs: 0,
                mediaAuxiliary: 0,
                status: 0,
                terms: 0,
                uploadedMediaKeys: 0,
                vault: 0,
                'assetMetadata.isCompleted': 0,
                'assetMetadata.context.formData.colors': 0,
                'assetMetadata.context.formData.culture': 0,
                'assetMetadata.context.formData.mood': 0,
                'assetMetadata.context.formData.orientation': 0,
                'assetMetadata.context.formData.description': 0,
                'assetMetadata.provenance': 0,
                'assetMetadata.taxonomy': 0,
                'assetMetadata.creators': 0,
                'formats.original': 0,
                'formats.exhibition.name': 0,
                'formats.exhibition.size': 0,
                'formats.exhibition.validation': 0,
                'formats.display': 0,
                'formats.print': 0,
                'formats.preview': 0,
                licenses: 0,
                consignArtwork: 0,
                framework: 0,
            },
        },
    ];

    return assets().aggregate(aggregate).toArray();
};
