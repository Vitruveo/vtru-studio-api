export interface JwtPayload {
    id: string;
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
