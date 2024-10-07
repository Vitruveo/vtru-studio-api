/* eslint-disable no-await-in-loop */

import { MigrationParameters } from '@nsfilho/migration';
import {
    COLLECTION_CREATORS,
    CreatorDocument,
} from '../features/creators/model';

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    const creators = await db
        .collection<CreatorDocument>(COLLECTION_CREATORS)
        .find({})
        .toArray();

    for (let i = 0; i < creators.length; i += 1) {
        const creator = creators[i];
        if (creator.emails && Array.isArray(creator.emails)) {
            for (let j = 0; j < creator.emails.length; j += 1) {
                const creatorEmail = creator.emails[j]?.email;
                if (
                    creatorEmail &&
                    typeof creatorEmail === 'string' &&
                    creatorEmail.length > 0
                ) {
                    const standardEmail = creatorEmail
                        .trim()
                        .toLowerCase()
                        .replace(/\.(?=.*@)|\+.*(?=@)/g, '');
                    if (
                        !creator.emails.some((e) => e.email === standardEmail)
                    ) {
                        await db
                            .collection<CreatorDocument>(COLLECTION_CREATORS)
                            .updateOne(
                                { _id: creator._id },
                                {
                                    $push: {
                                        emails: {
                                            email: standardEmail,
                                            codeHash: null,
                                            checkedAt: null,
                                        },
                                    },
                                }
                            );
                    }
                }
            }
        }
    }
};
