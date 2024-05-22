import { conditionsToShowAssets } from '../controller/public';
import { BuildSearchByPatternParams } from '../model/types';

export const buildSearchByPatternAggregate = ({
    match,
    searchFor,
    unwind,
    trim,
}: BuildSearchByPatternParams) => [
    { $unwind: unwind },
    {
        $match: {
            [match]: {
                $regex: new RegExp(`(^| )${searchFor}`, 'i'),
            },
            ...conditionsToShowAssets,
        },
    },
    {
        $group: {
            _id: {
                $trim: {
                    input: {
                        $toLower: trim ?? unwind,
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
];
