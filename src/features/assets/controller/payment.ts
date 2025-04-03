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
    ASSET_STORAGE_PRINT_OUTPUTS_NAME,
    SEARCH_URL,
    XIBIT_CATALOG_BASE_URL,
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
        images: string[];
    }[];
}

interface Catalog {
    sections: {
        categories: string[];
        priceMultiplier: number;
    }[];
}

const orderService = async ({ assetId, productId }: OrderService) => {
    const asset = await model.findAssetsById({ id: assetId });
    if (!asset) throw new Error('Asset not found');

    const catalogs = await axios.get<Catalog>(XIBIT_CATALOG_BASE_URL);

    const products = await axios.get<Product>(XIBIT_PRODUCTS_BASE_URL);
    const product = products.data.vertical.find(
        (item) => item.productId === productId
    );
    if (!product) throw new Error('Product not found');

    const section = catalogs.data.sections.find((item) =>
        item.categories.includes(product.categoryId)
    );
    if (!section) throw new Error('Section not found');

    const artworkLicense = () => {
        if (product.categoryId === 'mugs')
            return (
                asset.licenses.nft.single.editionPrice * section.priceMultiplier
            );
        if (product.categoryId === 'frames' || product.categoryId === 'posters')
            return (
                asset.licenses.nft.single.editionPrice *
                section.priceMultiplier *
                product.area
            );
        return 0;
    };
    const merchandiseFee = (product.price / 100) * 1.2;
    const platformFee = asset.licenses.nft.single.editionPrice * 0.02;
    const shipping = product.shipping / 100;

    const total = artworkLicense() + merchandiseFee + platformFee + shipping;

    const chroma = product.images
        .find((item) => item.includes('chroma'))!
        .replace(/^~\//, '');
    const imageUrlBucket = `https://${ASSET_STORAGE_PRINT_OUTPUTS_NAME}.s3.amazonaws.com/${assetId}/${product.productId}/${chroma}`;
    const imageUrl = imageUrlBucket.replace('.png', '.jpeg');

    return {
        assetId,
        productId,
        vendorProductId: product.vendorProductId,
        product: product.title,
        description: product.description,
        imageUrl,
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
