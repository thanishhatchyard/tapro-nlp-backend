const nspell = require('nspell');
const fs = require('fs');
const path = require('path');

const affPath = path.join(__dirname, '../node_modules', 'dictionary-en', 'index.aff');
const dicPath = path.join(__dirname, '../node_modules', 'dictionary-en', 'index.dic');
const aff = fs.readFileSync(affPath, 'utf-8');
const dic = fs.readFileSync(dicPath, 'utf-8');


const spellChecker = nspell(aff, dic);

// Function to correct spelling mistakes
const correctSpelling = (input) => {
  const words = input.split(' ');
  const correctedWords = words.map(word => {
    if (!spellChecker.correct(word)) {
      const corrections = spellChecker.suggest(word);
      return corrections.length > 0 ? corrections[0] : word;
    }
    return word;
  });

//   console.log(correctedWords)
  return correctedWords.join(' ');
};

module.exports = {
    correctSpelling
}