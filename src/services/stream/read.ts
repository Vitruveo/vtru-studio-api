import { createReadStream } from 'fs';
import type { ReadOptions } from './types';

export const read = ({ path }: ReadOptions) => createReadStream(path);
