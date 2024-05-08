/* eslint-disable no-await-in-loop */
import debug from 'debug';
import { JsonRpcProvider, Wallet, Contract } from 'ethers';

import testConfig from './config/testConfig.json';
import prodConfig from './config/prodConfig.json';
import type { CreateContractParams, CreateContractResponse } from './types';
import {
    MAINNET_RPC,
    STUDIO_PRIVATE_KEY,
    TESTNET,
    TESTNET_RPC,
} from '../../../constants';
import { retry } from '../../../utils';
import { captureException } from '../../sentry';

const logger = debug('services:contract');

const isTestNet = TESTNET === 'true';
const rpc = isTestNet ? TESTNET_RPC : MAINNET_RPC;
const config = isTestNet ? testConfig : prodConfig;

export const delay = async ({ time }: { time: number }) =>
    new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, time);
    });

export const createConsign = async ({
    header,
    creator,
    licenses,
    assetMedia,
    auxiliaryMedia,
}: CreateContractParams): Promise<CreateContractResponse> => {
    try {
        const provider = new JsonRpcProvider(rpc);
        const signer = new Wallet(STUDIO_PRIVATE_KEY, provider);
        const contract = new Contract(
            config.contractAddress,
            config.abi,
            signer
        );

        await retry(
            () =>
                contract.consign(
                    header,
                    creator, // Only one supported due to Solidity. Call function addCreator() to add more
                    licenses[0], // Only one supported due to Solidity. Call function addLicense() to add more
                    assetMedia,
                    auxiliaryMedia,
                    { value: 0 } // Optional if sending funds to payable function
                ),
            10,
            1000
        );

        await delay({ time: 10_000 });

        let assetId = -1;
        const response = {
            transactionHash: '',
            assetId,
        };
        // Get the event that was logged.
        const assetLog = contract.filters.AssetConsigned(null, creator.vault);

        if (assetLog) {
            const events = await contract.queryFilter(assetLog);

            if (Array.isArray(events) && events.length > 0) {
                const latest = events[events.length - 1];

                if (
                    latest?.topics &&
                    Array.isArray(latest.topics) &&
                    latest.topics.length > 1
                ) {
                    assetId = Number(latest.topics[1]);
                }

                response.transactionHash = latest?.transactionHash;
                response.assetId = assetId;
            }
        }

        await delay({ time: 10_000 });

        // Add extra licenses
        if (licenses.length > 1 && assetId > 0) {
            for (let i = 1; i < licenses.length; i += 1) {
                try {
                    await retry(
                        () =>
                            contract.addLicense(
                                assetId,
                                licenses[i],
                                { value: 0 } // Optional if sending funds to payable function
                            ),
                        10,
                        1000
                    );
                } catch (error) {
                    // send sentry
                    captureException(error);
                    // logger
                    logger('Error on addLicense:', error);
                }

                await delay({ time: 5_000 });
            }
        }

        return response;
    } catch (error) {
        console.log('error on create contract:', error);
        throw new Error('Error on create contract');
    }
};
