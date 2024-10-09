export interface LoginOtpConfirmRes {
    name: string;
    email: string;
}

export interface AuthResponse {
    nonce: string;
}

export interface QueryPaginatedParams {
    page: string;
    limit: string;
    sort: string;
}
