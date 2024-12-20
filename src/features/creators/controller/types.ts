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

export interface StackSpotlight {
    _id: string;
    username: string;
    stacks: {
        id: string;
        path: string;
        assets: string[];
        fees?: number;
        title?: string;
        description?: string;
        display?: string;
        interval?: string;
        url?: string;
        createdAt: string;
        type: string;
        quantity: number;
    };
}

export type SynapsSessionStatus =
    | 'SUBMISSION_REQUIRED'
    | 'APPROVED'
    | 'PENDING_VERIFICATION';

export interface SynapsIndividualSessionRes {
    app: {
        name: string;
        id: string;
    };
    session: {
        id: string;
        alias: string;
        status: SynapsSessionStatus;
        sandbox: boolean;
        steps: {
            id: string;
            status: 'APPROVED' | 'PENDING_VERIFICATION' | 'SUBMISSION_REQUIRED';
            type: 'LIVENESS' | 'ID_DOCUMENT' | 'PROOF_OF_ADDRESS' | 'PHONE';
        }[];
    };
}
