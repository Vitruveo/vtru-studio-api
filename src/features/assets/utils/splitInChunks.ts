export const splitIntoChunks = (array: any[], numChunks: number) => {
    const result = [];
    const chunkSize = Math.ceil(array.length / numChunks);

    for (let i = 0; i < numChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, array.length);
        result.push(array.slice(start, end));
    }

    return result;
};
