/* eslint-disable no-restricted-syntax */
import axios from 'axios';
import { DISCORD_URL } from '../../constants';

const MAX_DISCORD_MESSAGE_LENGTH = 2000;

export async function sendMessageDiscord({ message }: { message: string }) {
    try {
        if (message.length > MAX_DISCORD_MESSAGE_LENGTH) {
            const chunks =
                message.match(
                    new RegExp(`.{1,${MAX_DISCORD_MESSAGE_LENGTH}}`, 'g')
                ) || [];
            for await (const chunk of chunks) {
                await axios.post(DISCORD_URL, {
                    content: chunk,
                });
            }
        } else {
            await axios.post(DISCORD_URL, {
                content: message,
            });
        }
    } catch (error: any) {
        console.error('Erro ao enviar mensagem para o Discord:', error.data);
    }
}
