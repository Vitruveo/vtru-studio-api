export interface Header {
    title: string;
    description: string;
    metadataRefId: number;
    metadataXRefId: string;
    tokenUri: string;
    status: number; // 1 = draft, 2 = active, 3 = inactive
}

export interface Creator {
    refId: number;
    xRefId: string;
    vault: string;
    split: number;
}

export interface Collaborator1 {
    refId: number;
    xRefId: string;
    vault: string;
    split: number;
}

export interface Collaborator2 {
    refId: number;
    xRefId: string;
    vault: string;
    split: number;
}

export interface License1 {
    id: number;
    licenseTypeId: number;
    editions: number;
    editionCents: number;
    discountEditions: number;
    discountBasisPoints: number;
    discountMaxBasisPoints: number;
    available: number;
    licensees: `x0${string}`[];
}

export interface License2 {
    id: number;
    licenseTypeId: number;
    editions: number;
    editionCents: number;
    discountEditions: number;
    discountBasisPoints: number;
    discountMaxBasisPoints: number;
    available: number;
    licensees: `x0${string}`[];
}

export interface License3 {
    id: number;
    licenseTypeId: number;
    editions: number;
    editionCents: number;
    discountEditions: number;
    discountBasisPoints: number;
    discountMaxBasisPoints: number;
    available: number;
    licensees: `x0${string}`[];
}

export interface License4 {
    id: number;
    licenseTypeId: number;
    editions: number;
    editionCents: number;
    discountEditions: number;
    discountBasisPoints: number;
    discountMaxBasisPoints: number;
    available: number;
    licensees: `x0${string}`[];
}

export interface Licenses {
    id: number;
    licenseTypeId: number;
    data: number[];
    info: string[];
}

export interface AssetMedia {
    original: string;
    display: string;
    exhibition: string;
    preview: string;
    print: string;
}

export interface AuxiliaryMedia {
    arImage: string;
    arVideo: string;
    btsImage: string;
    btsVideo: string;
    codeZip: string;
}

export interface Media {
    original: string;
    display: string;
    exhibition: string;
    preview: string;
    print?: string | undefined;
    arImage?: string | undefined;
    arVideo?: string | undefined;
    btsImage?: string | undefined;
    btsVideo?: string | undefined;
    codeZip?: string | undefined;
}

export interface CreateContractParams {
    assetKey: string;
    header: Header;
    creator: Creator;
    collaborator1: Collaborator1;
    collaborator2: Collaborator2;
    license1: License1;
    license2: License2;
    license3: License3;
    license4: License4;
    media: Media;
}

export interface CreateContractResponse {
    transactionHash: string;
    assetId: number;
}

export interface CreatorDB {
    _id: string;
    username: string;
    vault?: {
        address: string;
        explorerUrl: string | null;
        transactionHash: string | null;
        contractAddress: string | null;
        vaultKey: string;
        blockNumber: number;
        createdAt: Date;
    };
    wallets: {
        address: string;
    }[];
}

export interface CheckVaultOptions {
    creator: CreatorDB;
}
export interface CreateVaultOptions {
    vaultKey: string;
    vaultName: string;
    vaultSymbol: string;
    wallets: string[];
}

export interface ExistsVaultByWalletOptions {
    wallet: string;
}
