import { MigrationParameters } from '@nsfilho/migration';
import { COLLECTION_ASSETS } from '../features/assets/model/schema';

const licensesData = {
    nft: {
        version: '1',
        added: true,
        license: 'CC BY-NC-ND',
        elastic: {
            editionPrice: 0,
            numberOfEditions: 0,
            totalPrice: 0,
            editionDiscount: false,
        },
        single: {
            editionPrice: 150,
        },
        unlimited: {
            editionPrice: 0,
        },
        editionOption: 'single',
    },
    stream: {
        version: '1',
        added: true,
    },
    print: {
        version: '1',
        added: false,
        unitPrice: 0,
    },
    remix: {
        version: '1',
        added: false,
        unitPrice: 0,
    },
};

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    await db.collection(COLLECTION_ASSETS).updateMany(
        { licenses: { $exists: true } },
        {
            $set: {
                'licenses.nft': licensesData.nft,
                'licenses.stream': licensesData.stream,
            },
        }
    );
};
