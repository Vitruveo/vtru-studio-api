import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { APIResponse } from '../../../services';
import { countAllCreators } from '../../creators/model';
import { countAllAssets, getTotalPrice } from '../../assets/model';
import { sendMessageDiscord } from '../../../services/discord';

dayjs.extend(utc);
dayjs.extend(timezone);

const logger = debug('features:dashboard:controller');
const route = Router();

route.get('/', async (req, res) => {
    try {
        const date = req.query.date as string;
        const start = req.query.start as string;
        const end = req.query.end as string;

        if ((start && !end) || (!start && end)) {
            res.status(400).json({
                code: 'vitruveo.studio.api.admin.dashboard.reader.one.failed',
                message: 'Invalid date range, missing some parameter',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }
        if (start && end && dayjs(start).isAfter(dayjs(end))) {
            res.status(400).json({
                code: 'vitruveo.studio.api.admin.dashboard.reader.one.failed',
                message: 'Invalid date range, start date is after end date',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const dateFormatted = date
            ? dayjs(date).utc().endOf('day').toDate()
            : dayjs().utc().endOf('day').toDate();
        const yesterdayFormatted = date
            ? dayjs(date).utc().subtract(1, 'day').startOf('day').toDate()
            : dayjs().utc().subtract(1, 'day').startOf('day').toDate();

        const buildQuery = (key: string, prop: 'total' | 'new') => {
            let startDate;
            if (prop === 'total') {
                startDate = dayjs(0).utc().toDate();
            } else if (start) {
                startDate = dayjs(start).utc().toDate();
            } else {
                startDate = yesterdayFormatted;
            }
            const endDate = end
                ? dayjs(end).utc().endOf('day').toDate()
                : dateFormatted;

            return {
                $or: [
                    { [key]: { $gte: startDate, $lt: endDate } },
                    {
                        [key]: {
                            $gte: startDate.toISOString(),
                            $lt: endDate.toISOString(),
                        },
                    },
                ],
            };
        };

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

        await sendMessageDiscord({
            message: `Vitruveo Dashboard:\n
                date: ${date},
                start: ${start},
                end: ${end},
                totalCreators: ${totalCreators},
                newCreators: ${newCreators},
                totalArts: ${totalArts},
                newArts: ${newArts},
                totalConsigned: ${totalConsigned},
                newConsigned: ${newConsigned},
                totalActiveConsigned: ${totalActiveConsigned},
                newActiveConsigned: ${newActiveConsigned},
                totalArtsSold: ${totalArtsSold},
                newArtsSold: ${newArtsSold},
                totalPrice: ${totalPrice},
                averagePrice: ${averagePrice},
                periodTotalPrice: ${periodTotalPrice},
                periodAveragePrice: ${periodAveragePrice}`,
        });

        const response = {
            date,
            start,
            end,
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
