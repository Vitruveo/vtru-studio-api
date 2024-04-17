export const IPFS_HOST = process.env.IPFS_HOST || '';
export const IPFS_PROTOCOL = process.env.IPFS_PROTOCOL || '';
export const IPFS_AUTHORIZATION = process.env.IPFS_AUTHORIZATION || '';
export const IPFS_PORT = process.env.IPFS_PORT
    ? parseInt(process.env.IPFS_PORT, 10)
    : 5001;
