import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { APIResponse } from '../../../services';
import { countAllCreators } from '../../creators/model';
import { countAllAssets, getTotalPrice } from '../../assets/model';
// import { sendMessageDiscord } from '../../../services/discord';

dayjs.extend(utc);
dayjs.extend(timezone);

const logger = debug('features:dashboard:controller');
const route = Router();

route.get('/', async (req, res) => {
    try {
        const date = req.query.date as string;

        const dateFormatted = date
            ? dayjs(date).utc().endOf('day').toDate()
            : dayjs().utc().endOf('day').toDate();
        const yesterdayFormatted = date
            ? dayjs(date).utc().subtract(1, 'day').startOf('day').toDate()
            : dayjs().utc().subtract(1, 'day').startOf('day').toDate();

        const buildQuery = (key: string, prop: 'total' | 'new') => ({
            $or: [
                {
                    [key]: {
                        $gte:
                            prop === 'total'
                                ? dayjs(0).utc().toDate()
                                : yesterdayFormatted,
                        $lt: dateFormatted,
                    },
                },
                {
                    [key]: {
                        $gte:
                            prop === 'total'
                                ? dayjs(0).utc().toISOString()
                                : yesterdayFormatted.toISOString(),
                        $lt: dateFormatted.toISOString(),
                    },
                },
            ],
        });

        const totalCreators = await countAllCreators({
            ...buildQuery('framework.createdAt', 'total'),
        });
        const newCreators = await countAllCreators({
            ...buildQuery('framework.createdAt', 'new'),
        });
        const totalArts = await countAllAssets({
            ...buildQuery('framework.createdAt', 'total'),
        });
        const newArts = await countAllAssets({
            ...buildQuery('framework.createdAt', 'new'),
        });
        const totalConsigned = await countAllAssets({
            contractExplorer: { $exists: true },
            ...buildQuery('consignArtwork.listing', 'total'),
        });
        const newConsigned = await countAllAssets({
            contractExplorer: { $exists: true },
            ...buildQuery('consignArtwork.listing', 'new'),
        });
        const totalActiveConsigned = await countAllAssets({
            contractExplorer: { $exists: true },
            'consignArtwork.status': 'active',
            ...buildQuery('consignArtwork.listing', 'total'),
        });
        const newActiveConsigned = await countAllAssets({
            contractExplorer: { $exists: true },
            'consignArtwork.status': 'active',
            ...buildQuery('consignArtwork.listing', 'new'),
        });
        const totalArtsSold = await countAllAssets({
            mintExplorer: { $exists: true },
            ...buildQuery('mintExplorer.createdAt', 'total'),
        });
        const newArtsSold = await countAllAssets({
            mintExplorer: { $exists: true },
            ...buildQuery('mintExplorer.createdAt', 'new'),
        });
        const totalPrice = await getTotalPrice();
        const averagePrice = totalPrice / totalArtsSold;
        const periodTotalPrice = '';
        const periodAveragePrice = '';

        // await sendMessageDiscord({
        //     message: `Vitruveo Dashboard:\n
        //         creators: ${creators}
        //         arts: ${arts}
        //         consigned: ${consigned}
        //         activeConsigned: ${activeConsigned}
        //         totalPrice: ${totalPrice}
        //         artsSold: ${artsSold}
        //         averagePrice: ${averagePrice}`,
        // });

        const response = {
            date,
            totalCreators,
            newCreators,
            totalArts,
            newArts,
            totalConsigned,
            newConsigned,
            totalActiveConsigned,
            newActiveConsigned,
            totalArtsSold,
            newArtsSold,
            totalPrice,
            averagePrice,
            periodTotalPrice,
            periodAveragePrice,
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
