// Imports _____________________________________________________________________

const chai = require('chai');
const expect = chai.expect;

const hyphenToCamel = require('../utilities.js').hyphenToCamel;

// Test Suite __________________________________________________________________

describe('utilities', () => {
    describe('.hyphenToCamel()', () => {
        it('should remove all hyphens from a string', () => {
            const input = 'now-watch-me-whip';
            const output = hyphenToCamel(input);

            expect(output.indexOf('-')).to.equal(-1);
        });

        it('should leave unhyphenated words untouched', () => {
            const input = 'superman';
            const output = hyphenToCamel(input);

            expect(output).to.equal(input);
        });

        it('should not capitalize the first word', () => {
            const input = 'watch-me';
            const output = hyphenToCamel(input).substr(0, 5);
            const expected = 'watch';

            expect(output).to.equal(expected);
        });

        it('should capitilize every n + 1 word', () => {
            const input = 'now-watch-me-bop-bop-bop-bop';
            const output = hyphenToCamel(input);
            const expected = 'nowWatchMeBopBopBopBop';

            expect(output).to.equal(expected);
        });

        it('should handle multiple recurrences of hyphens', () => {
            const input = 'duff--duff-------duff';
            const output = hyphenToCamel(input);
            const expected = 'duffDuffDuff';

            expect(output).to.equal(expected);
        });

        it('should trim hyphens from the beginning of a word', () => {
            const input = '--duff--duff';
            const output = hyphenToCamel(input);
            const expected = 'duffDuff';

            expect(output).to.equal(expected);
        });
    });
});
