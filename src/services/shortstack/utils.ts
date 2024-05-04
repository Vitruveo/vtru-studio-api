import type { IsVideoParams } from './types';

export const isVideo = ({ path }: IsVideoParams) =>
    [
        '.mp4',
        '.mov',
        '.avi',
        '.wmv',
        '.flv',
        '.mkv',
        '.webm',
        '.mpeg',
        '.mpg',
        '.m4v',
        '.3gp',
    ].some((ext) => path.endsWith(ext));
