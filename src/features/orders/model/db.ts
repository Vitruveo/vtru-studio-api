import { COLLECTION_ORDERS } from './schema';

import { getDb } from '../../../services/mongo';

const orders = () => getDb().collection(COLLECTION_ORDERS);

export const createNewOrder = async (order: any) => orders().insertOne(order);
