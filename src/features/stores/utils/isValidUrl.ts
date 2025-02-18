import axios from 'axios';
import { GENERAL_STORAGE_URL } from '../../../constants';

export const isValidUrl = async (
    url: string
): Promise<boolean | 'characters' | 'reservedWords'> => {
    if (!url.match(/^[a-zA-Z0-9-]+$/) || url.length < 4) return 'characters';

    const reservedWords = await axios.get(
        `${GENERAL_STORAGE_URL}/reservedWords.json`
    );

    if (reservedWords.data.includes(url)) return 'reservedWords';

    return true;
};
