import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '../../constants';

// @ts-ignore
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2020-08-27' });

interface Order {
    assetId: string;
    product: string;
    description: string;
    imageUrl: string;
    assetUrl: string;
    price: number;
    productId: string;
    vendorProductId: string;

    domainURL: string;
}

export const retrieveSession = (sessionId: string) =>
    stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] });

export const createSession = (order: Order) =>
    stripe.checkout.sessions.create({
        mode: 'payment',
        client_reference_id: order.assetId,
        line_items: [
            {
                price_data: {
                    currency: 'USD',
                    product_data: {
                        name: order.product,
                        description: order.description,
                        images: [order.imageUrl, order.assetUrl],
                    },
                    unit_amount: order.price,
                },
                quantity: 1,
            },
        ],
        custom_text: {
            shipping_address: {
                message: 'Print fulfillment by Gelato.com',
            },
        },
        metadata: {
            assetId: order.assetId,
            productId: order.productId,
            vendorProductId: order.vendorProductId,
        },
        invoice_creation: {
            enabled: false,
            invoice_data: {
                description: order.description,
            },
        },
        shipping_address_collection: {
            allowed_countries: [
                'AE',
                'AT',
                'AU',
                'BE',
                'BR',
                'CA',
                'CH',
                'CL',
                'CN',
                'CZ',
                'DE',
                'DK',
                'ES',
                'FR',
                'GB',
                'IE',
                'IN',
                'IT',
                'JP',
                'KR',
                'MX',
                'NL',
                'NO',
                'NZ',
                'PT',
                'RU',
                'SE',
                'SG',
                'TR',
                'US',
            ],
        },
        success_url: `${order.domainURL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${order.domainURL}/index.html`,
    });
