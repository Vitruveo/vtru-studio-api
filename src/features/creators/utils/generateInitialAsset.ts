import { ObjectId } from 'mongodb';
import { CreateAssetsParams } from '../../assets/model/types';

const generateInitialAsset = (): CreateAssetsParams => ({
    asset: {
        _id: new ObjectId(),
        status: 'draft',
        framework: {
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: null,
            updatedBy: null,
        },
        assetRefId: null,
        uploadedMediaKeys: [],
        ipfs: {
            preview: '',
            original: '',
            display: '',
            exhibition: '',
            print: '',
            arImage: '',
            arVideo: '',
            btsImage: '',
            btsVideo: '',
            codeZip: '',
            finishedAt: null,
        },
        assetMetadata: {
            creators: {
                formData: [],
            },
            context: {
                formData: {
                    title: '',
                    description: '',
                    longDescription: '',
                    moods: [],
                    tags: [],
                    colors: [],
                },
            },
        },
        domain: '',
        formats: {
            preview: null,
            original: null,
            display: null,
            exhibition: null,
            print: null,
        },
        mediaAuxiliary: {
            formats: {
                arImage: null,
                arVideo: null,
                btsImage: null,
                btsVideo: null,
                codeZip: null,
            },
            description: '',
        },
        licenses: {
            print: {
                version: '',
                added: false,
                availableLicenses: 0,
                unitPrice: 0,
            },
            nft: {
                version: '',
                added: false,
                license: '',
                elastic: {
                    editionPrice: 0,
                    numberOfEditions: 0,
                    totalPrice: 0,
                    editionDiscount: false,
                },
                single: {
                    editionPrice: 0,
                },
                unlimited: {
                    editionPrice: 0,
                },
                editionOption: '',
                availableLicenses: 0,
            },
            stream: {
                version: '',
                added: false,
            },
            remix: {
                version: '',
                added: false,
                availableLicenses: 0,
                unitPrice: 0,
            },
        },
        isOriginal: false,
        generatedArtworkAI: false,
        notMintedOtherBlockchain: false,
        contract: false,
        consignArtwork: {
            status: 'draft',
            listing: null,
            wallet: null,
        },
        c2pa: {
            finishedAt: null,
        },
        contractExplorer: {
            creatorRefId: null,
            assetRefId: null,
            finishedAt: null,
            explorer: null,
            tx: null,
            assetId: null,
        },
    },
});

export default generateInitialAsset;
