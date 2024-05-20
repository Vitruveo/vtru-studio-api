/* eslint-disable no-await-in-loop */
import { JsonRpcProvider, Wallet, Contract } from 'ethers';

import schema from './config/contracts.json';

import type {
    CreateContractParams,
    CreateContractResponse,
    CreateVaultOptions,
} from './types';
import {
    MAINNET_RPC,
    STUDIO_PRIVATE_KEY,
    TESTNET,
    TESTNET_RPC,
} from '../../../constants';

const isTestNet = TESTNET === 'true';
const rpc = isTestNet ? TESTNET_RPC : MAINNET_RPC;
const provider = new JsonRpcProvider(rpc);
const signer = new Wallet(STUDIO_PRIVATE_KEY, provider);

const getContractAddress = (name: keyof typeof schema) =>
    schema[name][isTestNet ? 'testnet' : 'mainnet'];

const creatorVaultFactory = new Contract(
    getContractAddress('creatorVaultFactory'),
    schema.creatorVaultFactory.abi,
    signer
);

const mediaRegistry = new Contract(
    getContractAddress('mediaRegistry'),
    schema.mediaRegistry.abi,
    signer
);

const assetRegistry = new Contract(
    getContractAddress('assetRegistry'),
    schema.assetRegistry.abi,
    signer
);

const delay = async ({ time }: { time: number }) =>
    new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, time);
    });

export const createVault = ({
    vaultKey,
    vaultName,
    vaultSymbol,
    wallets,
}: CreateVaultOptions) =>
    new Promise((resolve, reject) => {
        const receiveEvent = (...args: any[]) => {
            console.log('args:', args);

            if (typeof args[0] === 'object' && args[0].hash) {
                creatorVaultFactory.off('VaultCreated', receiveEvent);
                resolve(args[2]);
            }
        };
        creatorVaultFactory.on('VaultCreated', receiveEvent);
        signer
            .getNonce()
            .then((nonce) =>
                creatorVaultFactory.createVault(
                    vaultKey,
                    vaultName,
                    vaultSymbol,
                    wallets,
                    { nonce }
                )
            )
            .catch((error) => {
                console.log('error on create vault:', error);

                reject(error);
            });
    });

export const transformCreateVaultResult = (info: any) => ({
    contractAddress: info.log.address,
    transactionHash: info.log.transactionHash,
    explorerUrl: `https://test-explorer.vitruveo.xyz/tx/${info.log.transactionHash}`,
    blockNumber: info.log.blockNumber,
    vaultAddress: info.args[1],
    createdAt: new Date(),
});

export const createConsign = async ({
    assetKey,
    header,
    creator,
    collaborator1,
    collaborator2,
    license1,
    license2,
    license3,
    license4,
    media,
}: CreateContractParams): Promise<CreateContractResponse> => {
    try {
        const nonce = await signer.getNonce();

        await assetRegistry.consign(
            assetKey,
            header,
            creator,
            collaborator1,
            collaborator2,
            license1,
            license2,
            license3,
            license4,
            { nonce }
        );

        await delay({ time: 10_000 });

        const keys = Object.keys(media);
        const values = Object.values(media);

        const mediaNonce = await signer.getNonce();

        await mediaRegistry.addMediaBatch(assetKey, keys, values, {
            nonce: mediaNonce,
        });

        await delay({ time: 5_000 });

        let assetId = -1;
        const response = {
            transactionHash: '',
            assetId,
        };
        // Get the event that was logged.
        const assetLog = assetRegistry.filters.AssetConsigned(
            null,
            creator.vault,
            null
        );

        if (assetLog) {
            const events = await assetRegistry.queryFilter(assetLog);

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

        return response;
    } catch (error) {
        console.log('error on create contract:', error);
        throw new Error('Error on create contract');
    }
};
