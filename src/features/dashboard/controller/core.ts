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
        const date = req.query.date as string;
        const start = req.query.start as string;
        const end = req.query.end as string;

        const dateFormatted = date
            ? new Date(`${date}T00:00:00.000Z`).toISOString()
            : null;
        const startFormatted = start
            ? new Date(`${start}T00:00:00.000Z`).toISOString()
            : null;
        const endFormatted = end
            ? new Date(`${end}T23:59:59.999Z`).toISOString()
            : null;

        const buildQuery = (key: string) => {
            let query = {};
            if (dateFormatted) {
                query = {
                    [key]: {
                        $gte: dateFormatted,
                        $lt: new Date(
                            new Date(dateFormatted).getTime() +
                                24 * 60 * 60 * 1000
                        ).toISOString(),
                    },
                };
            } else if (startFormatted && endFormatted) {
                query = {
                    [key]: {
                        $gte: startFormatted,
                        $lt: endFormatted,
                    },
                };
            }
            return query;
        };

        const creators = await countAllCreators({
            ...buildQuery('vault.createdAt'),
        });
        const arts = await countAllAssets();
        const consigned = await countAllAssets({
            contractExplorer: { $exists: true },
            ...buildQuery('consignArtwork.listing'),
        });
        const activeConsigned = await countAllAssets({
            contractExplorer: { $exists: true },
            'consignArtwork.status': 'active',
            ...buildQuery('consignArtwork.listing'),
        });
        const totalPrice = await getTotalPrice();
        const artsSold = await countAllAssets({
            mintExplorer: { $exists: true },
            ...buildQuery('mintExplorer.createdAt'),
        });
        const averagePrice = totalPrice / artsSold;

        await sendMessageDiscord({
            message: `Vitruveo Dashboard:\n 
                creators: ${creators}
                arts: ${arts}
                consigned: ${consigned}
                activeConsigned: ${activeConsigned}
                totalPrice: ${totalPrice}
                artsSold: ${artsSold}
                averagePrice: ${averagePrice}`,
        });

        const response = {
            creators,
            arts,
            consigned,
            activeConsigned,
            totalPrice,
            artsSold,
            averagePrice,
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
