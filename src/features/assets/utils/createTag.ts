export function createTagRegex(tags: string | string[]): RegExp[] {
    // If a single tag is passed, convert to array
    const tagsArray = Array.isArray(tags) ? tags : [tags];

    // Create regex patterns with trimmed spacing and case-insensitive
    const regexPatterns = tagsArray.map(
        (tag) => new RegExp(`^\\s*${tag}\\s*$`, 'i')
    );

    return regexPatterns;
}
