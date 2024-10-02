export interface LoginOtpConfirmRes {
    name: string;
    email: string;
}

export interface AuthResponse {
    nonce: string;
}

export interface ArtistSpotlight {
    _id: string;
    avatar: string;
    username: string;
}
