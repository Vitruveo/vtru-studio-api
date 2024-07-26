export interface RequestConsignProps {
    _id: string;
    status: string;
    asset: {
        _id: string;
        title: string;
    };
    creator: {
        _id: string;
        username: string;
        emails: string[];
        vault: {
            isTrusted: boolean;
            isBlocked: boolean;
        };
    };
    logs?: {
        status: string;
        message: string;
        when: Date;
    }[];
    comments?: {
        username: string;
        comment: string;
        when: string;
    }[];
}
