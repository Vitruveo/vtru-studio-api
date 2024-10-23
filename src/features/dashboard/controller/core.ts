import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import { APIResponse } from '../../../services';
import { countAllCreators } from '../../creators/model';
import { countAllAssets, getTotalPrice } from '../../assets/model';
import { sendMessageDiscord } from '../../../services/discord';

const logger = debug('features:dashboard:controller');
const route = Router();

route.get('/', async (req, res) => {
    try {
        const totalCreators = await countAllCreators();
        const totalArts = await countAllAssets();
        const consigned = await countAllAssets({
            contractExplorer: { $exists: true },
        });
        const activeConsigned = await countAllAssets({
            contractExplorer: { $exists: true },
            'consignArtwork.status': 'active',
        });
        const totalPrice = await getTotalPrice();
        const artsSold = await countAllAssets({
            mintExplorer: { $exists: true },
        });

        const averagePrice = totalPrice / artsSold;

        await sendMessageDiscord({
            message: `Vitruveo Dashboard:\n 
            creators: ${totalCreators}
            arts: ${totalArts}
            consigned: ${consigned}
            activeConsigned: ${activeConsigned}
            totalPrice: ${totalPrice}
            artsSold: ${artsSold}
            averagePrice: ${averagePrice}`,
        });

        const response = {
            creators: {
                total: totalCreators,
            },
            arts: {
                total: totalArts,
                consigned,
                activeConsigned,
                sold: artsSold,
                totalPrice,
                averagePrice,
            },
        };

        res.json({
            code: 'vitruveo.studio.api.admin.dashboard.reader.one.success',
            message: 'Reader dashboard success',
            transaction: nanoid(),
            data: response,
        } as APIResponse);
    } catch (error) {
        logger('Reader dashboard failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.dashboard.reader.one.failed',
            message: `Reader dashboard failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
