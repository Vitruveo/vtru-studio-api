/* eslint-disable no-param-reassign */
import { createTagRegex } from '../utils/createTag';
import { queryByPrice, queryByTitleOrDescOrCreator } from '../utils/queries';
import { ObjectId } from '../../../services/mongo';

const groupedOptions = ['all', 'noSales'];

// this is used to filter assets that are not ready to be shown
export const conditionsToShowAssets = {
    'consignArtwork.status': 'active',
    'contractExplorer.explorerUrl': {
        $exists: true,
    },
    'licenses.nft.added': true,
    'formats.preview.path': {
        $exists: true,
        $ne: null,
    },
};

interface BuildQueryParams {
    key: string;
    value: any;
    parsedQuery: Record<string, any>;
}

const buildQuery = ({ key, value, parsedQuery }: BuildQueryParams) => {
    switch (key) {
        case 'assetMetadata.taxonomy.formData.tags': {
            const tags = value?.$in as string[];
            if (Array.isArray(tags)) {
                parsedQuery[key] = { $in: createTagRegex(tags) };
                delete parsedQuery[key];
            }

            return parsedQuery;
        }

        case 'assetMetadata.context.formData.colors': {
            const colors = value?.$in as string[][];
            if (Array.isArray(colors)) {
                parsedQuery.avoid.colors = colors.map((color) =>
                    color.map((rgb) => parseInt(rgb, 10))
                );
                delete parsedQuery[key];
            }

            return parsedQuery;
        }

        case 'assetMetadata.creators.formData.name': {
            const creators = value?.$in as string[];
            if (Array.isArray(creators)) {
                parsedQuery['assetMetadata.creators.formData'] = {
                    $elemMatch: {
                        $or: creators.map((creator: string) => ({
                            name: { $regex: `^${creator}$`, $options: 'i' },
                        })),
                    },
                };

                delete parsedQuery[key];
            }

            return parsedQuery;
        }

        case 'assetMetadata.taxonomy.formData.subject': {
            const subjects = value?.$in as string[];
            if (Array.isArray(subjects)) {
                subjects.forEach((subject: string) => {
                    parsedQuery.$and.push({
                        [key]: {
                            $elemMatch: {
                                $regex: subject,
                                $options: 'i',
                            },
                        },
                    });
                });

                delete parsedQuery[key];
            }

            return parsedQuery;
        }

        case 'assetMetadata.taxonomy.formData.collections': {
            const collections = value?.$in as string[];
            if (Array.isArray(collections)) {
                collections.forEach((collection: string) => {
                    parsedQuery.$and.push({
                        'assetMetadata.taxonomy.formData.collections': {
                            $elemMatch: {
                                $regex: collection,
                                $options: 'i',
                            },
                        },
                    });
                });

                delete parsedQuery[key];
            }

            return parsedQuery;
        }

        case '_id': {
            const includeIds = value?.$in as string[];
            if (Array.isArray(includeIds))
                parsedQuery[key].$in = includeIds.map((id) => new ObjectId(id));

            const excludeIds = value?.$nin as string[];
            if (Array.isArray(excludeIds))
                parsedQuery[key].$nin = excludeIds.map(
                    (id) => new ObjectId(id)
                );

            if (typeof value === 'string') {
                parsedQuery[key] = new ObjectId(value);
            }

            return parsedQuery;
        }

        case 'framework.createdBy': {
            const ids = value?.$in as string[];
            if (Array.isArray(ids)) {
                parsedQuery[key].$in = ids;
            }

            return parsedQuery;
        }

        default: {
            return parsedQuery;
        }
    }
};

interface BuildParsedQueryGroupedParams {
    query: Record<string, any>;
    maxPrice: number;
    minPrice: number;
    name: string;
    hasBts: boolean;
    hasNftAutoStake: boolean;
    storesId: string;
}

export const buildParsedQueryGrouped = ({
    query,
    maxPrice,
    minPrice,
    name,
    hasBts,
    hasNftAutoStake,
    storesId,
}: BuildParsedQueryGroupedParams) => {
    const parsedQuery: Record<string, any> = {
        ...query,
        ...conditionsToShowAssets,
        $or: [],
        $and: [],
        avoid: {
            colors: [],
        },
    };

    if (name) {
        const searchByTitleDescCreator = {
            $or: queryByTitleOrDescOrCreator({ name }),
        };

        parsedQuery.$and.push(searchByTitleDescCreator);
    }

    if (minPrice >= 0 && maxPrice > 0) {
        const priceCondition = {
            $or: queryByPrice({
                min: minPrice,
                max: maxPrice,
            }),
        };

        parsedQuery.$and.push(priceCondition);
    }

    if (hasBts) {
        const btsConditions = {
            $or: [
                { 'mediaAuxiliary.formats.btsImage': { $ne: null } },
                { 'mediaAuxiliary.formats.btsVideo': { $ne: null } },
            ],
        };

        parsedQuery.$and.push(btsConditions);
    }

    if (hasNftAutoStake) {
        const nftFilters = { 'licenses.nft.autoStake': true };

        parsedQuery.$and.push(nftFilters);
    }

    if (storesId) {
        const storesFilters = [
            { stores: { $exists: false } },
            { stores: null },
            { 'stores.visibility': 'visibleInAllStores' },
            {
                'stores.visibility': 'visibleInSelectedStores',
                'stores.list': storesId,
            },
            {
                'stores.visibility': 'hiddenInSelectedStores',
                'stores.list': { $nin: [storesId] },
            },
        ];

        parsedQuery.$or.push(...storesFilters);
    }

    const queries = Object.entries(query);
    for (let i = 0; i < queries.length; i += 1) {
        const [key, value] = queries[i];

        buildQuery({
            key,
            value,
            parsedQuery,
        });
    }

    if (parsedQuery?._id?.$in && parsedQuery?.['framework.createdBy']?.$in) {
        const parsedIds = [
            ...(parsedQuery?._id?.$in as string[]),
            ...(parsedQuery?.['framework.createdBy']?.$in as string[]),
        ];

        parsedQuery.$or.push(...parsedIds);

        delete parsedQuery['framework.createdBy'].$in;
        delete parsedQuery._id.$in;

        if (Object.keys(parsedQuery._id).length === 0) {
            delete parsedQuery._id;
        }
        if (Object.keys(parsedQuery['framework.createdBy']).length === 0) {
            delete parsedQuery['framework.createdBy'];
        }
    }

    if (Object.keys(parsedQuery.$or).length === 0) {
        delete parsedQuery.$or;
    }
    if (Object.keys(parsedQuery.$and).length === 0) {
        delete parsedQuery.$and;
    }

    const grouped = groupedOptions.includes(query.grouped as string)
        ? (query.grouped as string)
        : 'all';
    delete parsedQuery.grouped;

    return { parsedQuery, grouped };
};
