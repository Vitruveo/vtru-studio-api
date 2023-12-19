import { createHash } from 'crypto';
import { customAlphabet } from 'nanoid';
import { LOGIN_CODE_SALT } from '../../../constants';

const nanoid = customAlphabet('0123456789', 6);

export const encryptCode = (code: string) => {
    const sha256 = createHash('sha256');
    const encryptedCode = sha256
        .update(code)
        .update(LOGIN_CODE_SALT)
        .digest('hex');
    return encryptedCode;
};

export const generateCode = () => {
    const randomNumbers = nanoid();
    const formattedNumber = `${randomNumbers.slice(0, 3)}${randomNumbers.slice(
        3
    )}`;
    return formattedNumber;
};
