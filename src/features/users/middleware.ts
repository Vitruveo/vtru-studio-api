import * as jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { JWT_SECRETKEY } from '../../constants';
import type { JwtPayload } from '../common/types';

// express middleware for check user authentication jwt token is valid
export function checkAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1] || null;
    if (token) {
        jwt.verify(token, JWT_SECRETKEY, (err, decoded) => {
            if (err) {
                res.status(401).json({ message: 'Failed to authenticate' });
            } else {
                const permissions = (decoded as JwtPayload).permissions || [];

                if ((decoded as JwtPayload).type === 'user') {
                    permissions.push('admin');
                }

                req.auth = {
                    id: (decoded as JwtPayload).id,
                    type: (decoded as JwtPayload).type,
                    permissions,
                };
                next();
            }
        });
    } else {
        res.status(401).json({ message: 'No token provided' });
    }
}
