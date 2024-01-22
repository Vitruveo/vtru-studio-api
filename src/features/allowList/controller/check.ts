import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';

import { APIResponse } from '../../../services';

const logger = debug('features:allowList:controller:check');
const route = Router();

route.get('/:email', async (req, res) => {
    try {
        const email = await model.checkEmailExist({
            email: req.params.email,
        });

        if (!email) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.allowList.email.not.found',
                message: `Checked email failed: email not found`,
                args: [],
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        res.json({
            code: 'vitruveo.studio.api.admin.allowList.email.success',
            message: 'Checked email with success',
            transaction: nanoid(),
            data: true,
        } as APIResponse<boolean>);
    } catch (error) {
        logger('Exist email allowList failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.allowList.email.failed',
            message: `Exist email failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
