// Utility Methods _____________________________________________________________

/**
 * Converts a hyphenated string to camelCase.
 *
 * @param  {String} str The string to convert.
 * @return {String} A camel-cased string, free of any hyphens.
 */
function hyphenToCamel(str) {
    if (str.indexOf('-') === -1) {
        return str;
    }

    // Handle cases where string begins with a hyphen.
    const hyphen_test = str.match(/-+\w.+/);
    if (hyphen_test !== null && hyphen_test.index === 0) {
        str = str.match(/\w.+/)[0];
    }

    const words = str.split('-').map((word, i) => {
        // Skip the first word;
        // Ignore empty strings created by multiple hyphens.
        if (i === 0 || !word.length) {
            return word;
        }

        const letters = word.split('');
        letters[0] = letters[0].toUpperCase();

        return letters.join('');
    })

    return words.join('');
}

// Exports _____________________________________________________________________

module.exports = {
    hyphenToCamel: hyphenToCamel,
};
