export interface Framework {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
}

export interface CreateRecordFrameworkParams {
    createdBy: string | null;
}
export interface UpdateRecordFrameworkParams {
    framework: Framework;
    updatedBy: string | null;
}

export const createRecordFramework = ({
    createdBy,
}: CreateRecordFrameworkParams) => ({
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy,
    updatedBy: null,
});

export const updateRecordFramework = ({
    framework,
    updatedBy,
}: UpdateRecordFrameworkParams) => ({
    createdAt: framework.createdAt,
    createdBy: framework.createdBy,
    updatedAt: new Date(),
    updatedBy,
});

export const defaultRecordFramework = () => ({
    createdAt: null,
    createdBy: null,
    updatedAt: new Date(),
    updatedBy: new Date(),
});
