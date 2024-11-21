import { MigrationParameters } from '@nsfilho/migration';
import { COLLECTION_ASSETS } from '../features/assets/model';

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    try {
        await db
            .collection(COLLECTION_ASSETS)
            .aggregate([
                {
                    $addFields: {
                        createdByObjectId: {
                            $toObjectId: '$framework.createdBy',
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'creators',
                        localField: 'createdByObjectId',
                        foreignField: '_id',
                        as: 'creatorDetails',
                    },
                },
                {
                    $addFields: {
                        'creator.username': {
                            $arrayElemAt: ['$creatorDetails.username', 0],
                        },
                    },
                },
                {
                    $project: {
                        creatorDetails: 0,
                        createdByObjectId: 0,
                    },
                },
                {
                    $merge: {
                        into: COLLECTION_ASSETS,
                        whenMatched: 'merge',
                        whenNotMatched: 'fail',
                    },
                },
            ])
            .toArray();
    } catch (error) {
        console.log('error in migration 29', error);
        throw error;
    }
};
