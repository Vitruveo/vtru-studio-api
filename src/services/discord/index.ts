import axios from 'axios';
import { DISCORD_URL } from '../../constants';

export async function sendMessageDiscord({ message }: { message: string }) {
    try {
        await axios.post(DISCORD_URL, {
            content: message,
        });
    } catch (error) {
        console.error('Erro ao enviar mensagem para o Discord:', error);
    }
}
