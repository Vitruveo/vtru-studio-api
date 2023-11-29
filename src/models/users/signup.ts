import { createHash } from 'crypto';
import { PASSWORD_SALT } from '../../constants';

export const encryptPassword = (password: string) => {
    const sha256 = createHash('sha256');
    const encryptedPassword = sha256
        .update(password)
        .update(PASSWORD_SALT)
        .digest('hex');
    return encryptedPassword;
};
