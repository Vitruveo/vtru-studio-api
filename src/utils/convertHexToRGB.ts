export const convertHEXtoRGB = (hex: string) => {
    const parts = /#?(..)(..)(..)/.exec(hex);
    if (!parts) {
        throw new Error(`${hex} is not a valid HEX color.`);
    }
    return [
        parseInt(parts[1], 16),
        parseInt(parts[2], 16),
        parseInt(parts[3], 16),
    ];
};
