export const validatePath = async (path: string): Promise<boolean> => {
    try {
        const response = await fetch(path, { method: 'HEAD' });

        if (!response.ok) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
};
