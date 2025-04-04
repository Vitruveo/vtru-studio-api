export const ASSET_TEMP_DIR =
    process.env.ASSET_TEMP_DIR || '/tmp/vitruveo-studio';

export const GENERAL_STORAGE_NAME =
    process.env.GENERAL_STORAGE_NAME || 'vitruveo-studio-dev-general';
export const GENERAL_STORAGE_URL = process.env.GENERAL_STORAGE_URL || '';

export const ASSET_STORAGE_NAME =
    process.env.ASSET_STORAGE_NAME || 'vitruveo-studio-dev-assets';
export const ASSET_STORAGE_URL = process.env.ASSET_STORAGE_URL || '';

export const PRINT_OUTPUTS_STORAGE_NAME =
    process.env.PRINT_OUTPUTS_STORAGE_NAME ||
    'vitruveo-studio-qa-print-outputs';

export const ASSET_STORAGE_PRINT_OUTPUTS_NAME =
    process.env.ASSET_STORAGE_PRINT_OUTPUTS_NAME ||
    'https://vitruveo-studio-qa-print-outputs.s3.amazonaws.com';
