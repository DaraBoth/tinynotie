export type Token = {
    accessToken: string;
    expiresAt: number;
};

export type Users = {
    id: number;
    usernm: string;
    token: Token;
};