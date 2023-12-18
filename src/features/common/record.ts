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
    framework: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        updatedBy: null,
    },
});

export const updateRecordFramework = ({
    framework,
    updatedBy,
}: UpdateRecordFrameworkParams) => ({
    framework: {
        createdAt: framework.createdAt,
        createBy: framework.createdBy,
        updatedAt: new Date(),
        updatedBy,
    },
});
