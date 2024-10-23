import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import { APIResponse } from '../../../services';
import { countAllCreators, countAllStacks } from '../../creators/model';
import { countAllAssets, getTotalPrice } from '../../assets/model';
import { sendMessageDiscord } from '../../../services/discord';

const logger = debug('features:dashboard:controller');
const route = Router();

route.get('/', async (req, res) => {
    try {
        const totalCreators = await countAllCreators();
        const totalBlockedCreators = await countAllCreators({
            'vault.isBlocked': true,
        });
        const totalArts = await countAllAssets();
        const totalConsigned = await countAllAssets({
            contractExplorer: { $exists: true },
        });
        const totalRejected = await countAllAssets({
            'consignArtwork.status': 'rejected',
        });
        const totalPending = await countAllAssets({
            'consignArtwork.status': 'pending',
        });
        const activeConsigned = await countAllAssets({
            contractExplorer: { $exists: true },
            'consignArtwork.status': 'active',
        });
        const artsSold = await countAllAssets({
            mintExplorer: { $exists: true },
        });
        const totalPrice = await getTotalPrice({
            'contractExplorer.explorer': { $exists: true },
        });
        const totalSoldPrice = await getTotalPrice({
            'contractExplorer.explorer': { $exists: true },
            mintExplorer: { $exists: true },
        });
        const totalStackGrid = await countAllStacks({ type: 'grid' });
        const totalStackVideo = await countAllStacks({ type: 'video' });
        const totalStackSlideshow = await countAllStacks({ type: 'slideshow' });

        const averagePrice = totalPrice / artsSold;

        await sendMessageDiscord({
            message: `Vitruveo Dashboard:\n 
            creators: ${totalCreators}
            arts: ${totalArts}
            consigned: ${totalConsigned}
            activeConsigned: ${activeConsigned}
            totalPrice: ${totalPrice}
            artsSold: ${artsSold}
            averagePrice: ${averagePrice}`,
        });

        const response = {
            creators: {
                total: totalCreators,
                blocked: totalBlockedCreators,
            },
            arts: {
                total: totalArts,
                consigned: {
                    total: totalConsigned,
                    active: activeConsigned,
                    sold: artsSold,
                },
                rejected: {
                    total: totalRejected,
                },
                pending: {
                    total: totalPending,
                },
            },
            price: {
                total: totalPrice,
                average: averagePrice,
                sold: totalSoldPrice,
            },
            stacks: {
                total: totalStackGrid + totalStackVideo + totalStackSlideshow,
                grid: {
                    total: totalStackGrid,
                },
                video: {
                    total: totalStackVideo,
                },
                slideshow: {
                    total: totalStackSlideshow,
                },
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
