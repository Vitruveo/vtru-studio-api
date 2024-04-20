export interface Header {
    refId: number;
    agreeDateTime: number;
    title: string;
    description: string;
    metadataRefId: number;
}

export interface Creator {
    vault: string;
    refId: number;
    split: number;
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

export interface CreateContractParams {
    header: Header;
    creator: Creator;
    licenses: Licenses[];
    assetMedia: AssetMedia;
    auxiliaryMedia: AuxiliaryMedia;
}
