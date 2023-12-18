declare namespace Express {
    interface Request {
        auth: {
            id: string;
            type: 'user' | 'creator';
        };
    }
}
