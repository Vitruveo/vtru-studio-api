export interface APIEcho {
    server: string;
    time: string;
}

export interface APIResponse<T> {
    code: number;
    transaction: string;
    message: string;
    args: string[];
    data?: T;
}
