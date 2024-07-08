import { NextFunction, Request, Response } from 'express';
import { model } from '.';

export async function mustBeOwner(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const asset = await model.findAssetsById({ id: req.params.id });
    if (!asset) {
        res.status(404).json({ message: 'Asset not found' });
    }
    if (asset?.framework.createdBy !== req.auth.id) {
        res.status(403).json({
            message: "You don't have permission to this action",
        });
    }
    next();
}
