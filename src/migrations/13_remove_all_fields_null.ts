/* eslint-disable no-await-in-loop */

import { MigrationParameters } from '@nsfilho/migration';
import { COLLECTION_ASSETS } from '../features/assets/model/schema';

interface Creator {
    roles: string[];
}

const removeNullFields = (element: string[]) => element.filter(Boolean);

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    const assets = await db.collection(COLLECTION_ASSETS).find({}).toArray();

    for (let index = 0; index < assets.length; index += 1) {
        const element = assets[index];

        // context -> formData -> mood
        if (Array.isArray(element?.assetMetadata?.context?.formData?.mood))
            element.assetMetadata.context.formData.mood = removeNullFields(
                element?.assetMetadata?.context?.formData?.mood
            );

        // context -> formData -> colors
        if (Array.isArray(element?.assetMetadata?.context?.formData?.colors))
            element.assetMetadata.context.formData.colors = removeNullFields(
                element?.assetMetadata?.context?.formData?.colors
            );

        // taxonomy -> formData -> tags
        if (Array.isArray(element?.assetMetadata?.taxonomy?.formData?.tags))
            element.assetMetadata.taxonomy.formData.tags = removeNullFields(
                element?.assetMetadata?.taxonomy?.formData?.tags
            );

        // taxonomy -> formData -> arenabled
        if (!element?.assetMetadata?.taxonomy?.formData?.arenabled)
            element.assetMetadata.taxonomy.formData.arenabled = 'no';

        // taxonomy -> formData -> collections
        if (
            Array.isArray(
                element?.assetMetadata?.taxonomy?.formData?.collections
            )
        )
            element.assetMetadata.taxonomy.formData.collections =
                removeNullFields(
                    element.assetMetadata.taxonomy.formData.collections
                );

        // taxonomy -> formData -> medium
        if (Array.isArray(element?.assetMetadata?.taxonomy?.formData?.medium))
            element.assetMetadata.taxonomy.formData.medium = removeNullFields(
                element.assetMetadata.taxonomy.formData.medium
            );

        // taxonomy -> formData -> style
        if (Array.isArray(element?.assetMetadata?.taxonomy?.formData?.style))
            element.assetMetadata.taxonomy.formData.style = removeNullFields(
                element.assetMetadata.taxonomy.formData.style
            );

        // taxonomy -> formData -> subject
        if (Array.isArray(element?.assetMetadata?.taxonomy?.formData?.subject))
            element.assetMetadata.taxonomy.formData.subject = removeNullFields(
                element.assetMetadata.taxonomy.formData.subject
            );

        // provenance -> formData -> exhibitions
        if (
            Array.isArray(
                element?.assetMetadata?.provenance?.formData?.exhibitions
            )
        )
            element.assetMetadata.provenance.formData.exhibitions =
                removeNullFields(
                    element.assetMetadata.provenance.formData.exhibitions
                );

        // provenance -> formData -> awards
        if (Array.isArray(element?.assetMetadata?.provenance?.formData?.awards))
            element.assetMetadata.provenance.formData.awards = removeNullFields(
                element.assetMetadata.provenance.formData.awards
            );

        // creators -> formData -> roles
        if (Array.isArray(element?.assetMetadata?.creators?.formData))
            element.assetMetadata.creators.formData =
                element.assetMetadata.creators.formData.map(
                    (creator: Creator) => {
                        if (Array.isArray(creator?.roles)) {
                            const filteredRoles = removeNullFields(
                                creator.roles
                            );
                            return {
                                ...creator,
                                roles: filteredRoles,
                            };
                        }
                        return creator;
                    }
                );

        await db
            .collection(COLLECTION_ASSETS)
            .replaceOne({ _id: element._id }, element);
    }
};
