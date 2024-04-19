/* eslint-disable no-await-in-loop */
import { JsonRpcProvider, Wallet, Contract } from 'ethers';

import testConfig from './config/testConfig.json';
import prodConfig from './config/prodConfig.json';
import type { CreateContractParams } from './types';
import {
    MAINNET_RPC,
    STUDIO_PRIVATE_KEY,
    TESTNET,
    TESTNET_RPC,
} from '../../constants';

const isTestNet = TESTNET === 'true';
const rpc = isTestNet ? TESTNET_RPC : MAINNET_RPC;
const config = isTestNet ? testConfig : prodConfig;
const explorer = isTestNet
    ? 'https://test-explorer.vitruveo.xyz/'
    : 'https://explorer.vitruveo.xyz/';

export const delay = async ({ time }: { time: number }) =>
    new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, time);
    });

export const createContract = async ({
    header,
    creator,
    licenses,
    assetMedia,
    auxiliaryMedia,
}: CreateContractParams) => {
    try {
        const provider = new JsonRpcProvider(rpc);
        const signer = new Wallet(STUDIO_PRIVATE_KEY, provider);
        const contract = new Contract(
            config.contractAddress,
            config.abi,
            signer
        );

        // Consign artwork
        await contract.consign(
            header,
            creator, // Only one supported due to Solidity. Call function addCreator() to add more
            licenses[0], // Only one supported due to Solidity. Call function addLicense() to add more
            assetMedia,
            auxiliaryMedia,
            { value: 0 } // Optional if sending funds to payable function
        );

        let assetId = -1;
        const response = {
            explorer: '',
            tx: '',
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

                response.explorer = `${explorer}tx/${latest?.transactionHash}`;
                response.tx = latest?.transactionHash;
                response.assetId = assetId;
            }
        }

        // Add extra licenses
        // TODO: verify assetId
        if (licenses.length > 1 && assetId > 0) {
            for (let i = 1; i < licenses.length; i += 1) {
                if (i === 1) await delay({ time: 10_000 });
                else await delay({ time: 5_000 });

                await contract.addLicense(
                    assetId,
                    licenses[i],
                    { value: 0 } // Optional if sending funds to payable function
                );
            }
        }

        return response;
    } catch (error) {
        console.log('error on create contract:', error);
        throw new Error('Error on create contract');
    }
};
