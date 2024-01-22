import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';

import { APIResponse, UpdateResult, InsertOneResult } from '../../../services';

const logger = debug('features:waitingList:controller:attempt');
const route = Router();

route.post('/', async (req, res) => {
    try {
        const result = await model.createAttemptWaitingList({
            email: req.body.email,
        });

        res.json({
            code: 'vitruveo.studio.api.admin.waitingList.attempt.create.success',
            message: 'WaitingList attempt create success',
            transaction: nanoid(),
            data: result,
        } as APIResponse<InsertOneResult>);
    } catch (error) {
        logger('WaitingList attempt create failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.waitingList.attempt.create.failed',
            message: `WaitingList attempt create failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.put('/:email', async (req, res) => {
    try {
        const result = await model.updateAttemptWaitingList({
            email: req.params.email,
        });

        res.json({
            code: 'vitruveo.studio.api.admin.waitingList.attempt.update.success',
            message: 'WaitingList attempt update success',
            transaction: nanoid(),
            data: result,
        } as APIResponse<UpdateResult<model.WaitingListDocument>>);
    } catch (error) {
        logger('WaitingList attempt update failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.waitingList.attempt.update.failed',
            message: `WaitingList attempt update failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/:email', async (req, res) => {
    try {
        const email = await model.checkEmailExist({
            email: req.params.email,
        });

        if (!email) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.waitingList.email.not.found',
                message: `Checked email failed: email not found`,
                args: [],
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        res.json({
            code: 'vitruveo.studio.api.admin.waitingList.email.success',
            message: 'Checked email with success',
            transaction: nanoid(),
            data: true,
        } as APIResponse<boolean>);
    } catch (error) {
        logger('Exist email waitingList failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.waitingList.email.failed',
            message: `Exist email failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
