declare module Express {
    interface Request {
        auth: {
            id: string;
            type: 'user' | 'creator';
            permissions: string[];
        };
    }
}
