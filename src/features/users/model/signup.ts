import { createHash } from 'crypto';
import { customAlphabet } from 'nanoid';
import { PASSWORD_SALT } from '../../../constants';

export const encryptPassword = (password: string) => {
    const sha256 = createHash('sha256');
    const encryptedPassword = sha256
        .update(password)
        .update(PASSWORD_SALT)
        .digest('hex');
    return encryptedPassword;
};

export const generateToken = () =>
    `${customAlphabet('1234567890abcdef', 4)}-${customAlphabet(
        '1234567890abcdef',
        4
    )}`;
