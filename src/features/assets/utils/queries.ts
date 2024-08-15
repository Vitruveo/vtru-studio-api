export interface queryByPriceParams {
    min: number;
    max: number;
}
export const queryByPrice = ({ min, max }: queryByPriceParams) => [
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

export interface queryByTitleOrDescOrCreatorParams {
    name: string;
}
export const queryByTitleOrDescOrCreator = ({
    name,
}: queryByTitleOrDescOrCreatorParams) => [
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
