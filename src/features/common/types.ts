export interface JwtPayload {
    id: string;
    type: 'creator' | 'user';
    iat: number;
    exp: number;
}

export interface ResponseWithTransaction {
    transaction: string;
}

export interface Query {
    sort?: {
        field: string;
        order: number;
    };
    skip?: number;
    limit?: number;
}

export interface NeedsToBeOwnerPermissions {
    permissions: string[];
}
