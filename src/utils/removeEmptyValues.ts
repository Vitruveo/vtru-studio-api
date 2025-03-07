export const filterValidValues = <T>(
    array: (T | null | undefined | '')[]
): T[] =>
    array.filter(
        (item): item is T => item !== null && item !== undefined && item !== ''
    );
