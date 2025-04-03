import debug from 'debug';
import { nanoid } from 'nanoid';
import axios from 'axios';
import { z } from 'zod';
import { Router } from 'express';

import * as model from '../model';
import * as modelOrders from '../../orders/model';
import { APIResponse } from '../../../services';
import { createSession, retrieveSession } from '../../../services/stripe';
import {
    API_BASE_URL,
    ASSET_STORAGE_URL,
    SEARCH_URL,
    XIBIT_PRODUCTS_BASE_URL,
} from '../../../constants';
import { validateBodyForCreateCheckoutSession } from './rules';
import { schemaValidationForCreateCheckouSession } from './schemas';

const logger = debug('features:assets:controller:payment');
const route = Router();

interface OrderService {
    assetId: string;
    productId: string;
}

interface Product {
    vertical: {
        categoryId: string;
        productId: string;
        vendorProductId: string;
        description: string;
        title: string;
        area: number;
        price: number;
        shipping: number;
    }[];
}

const orderService = async ({ assetId, productId }: OrderService) => {
    const asset = await model.findAssetsById({ id: assetId });
    if (!asset) throw new Error('Asset not found');

    const products = await axios.get<Product>(XIBIT_PRODUCTS_BASE_URL);
    const product = products.data.vertical.find(
        (item) => item.productId === productId
    );
    if (!product) throw new Error('Product not found');

    const artworkLicense = () => {
        if (product.categoryId === 'mugs')
            return asset.licenses.nft.single.editionPrice * 0.1;
        if (product.categoryId === 'frames')
            return (
                asset.licenses.nft.single.editionPrice * 0.0008 * product.area
            );
        return 0;
    };
    const merchandiseFee = (product.price / 100) * 1.2;
    const platformFee = asset.licenses.nft.single.editionPrice * 0.02;
    const shipping = product.shipping / 100;

    const total = artworkLicense() + merchandiseFee + platformFee + shipping;

    return {
        assetId,
        productId,
        vendorProductId: product.vendorProductId,
        product: product.title,
        description: product.description,
        imageUrl: `${ASSET_STORAGE_URL}/${asset.formats.original!.path}`,
        price: Number(total.toFixed(2)) * 100,
        quantity: 1,
    };
};

route.post(
    '/create-checkout-session',
    validateBodyForCreateCheckoutSession,
    async (req, res) => {
        try {
            const { assetId, productId } = req.body as z.infer<
                typeof schemaValidationForCreateCheckouSession
            >;

            const domainURL = `${API_BASE_URL}/assets/payment`;

            const order = await orderService({ assetId, productId });

            const session = await createSession({
                ...order,
                domainURL,
            });

            res.json({
                code: 'vitruveo.studio.api.assets.payment.create.checkout.session.success',
                message: 'Checkout session created successfully',
                transaction: nanoid(),
                data: session.url,
            } as APIResponse);
        } catch (error) {
            logger('Create checkout session failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.assets.payment.create.checkout.session.failed',
                message: `Reader failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.get('/success', async (req, res) => {
    try {
        const sessionId = req.query.session_id;
        const session = await retrieveSession(sessionId as string);

        await modelOrders.createNewOrder(session);

        res.redirect(`${SEARCH_URL}/congratulations`);
    } catch (error) {
        logger('Retrieve session failed: %O', error);

        res.status(500).json({
            code: 'vitruveo.studio.api.assets.payment.retrieve.failed',
            message: `Retrieve session failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
