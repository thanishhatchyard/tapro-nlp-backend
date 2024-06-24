import { readFile } from 'fs/promises';
import NSpell from 'nspell';


const affPath = './dictionary/index.aff';
const dicPath = './dictionary/index.dic';

async function loadDictionary() {
  const [aff, dic] = await Promise.all([
    readFile(affPath, 'utf-8'),
    readFile(dicPath, 'utf-8')
  ]);

  return new NSpell(aff, dic);
}

export const correctSpelling = async (input) => {
  const spellChecker = await loadDictionary();
  const words = input.split(' ');
  const correctedWords = words.map(word => {
    if (!spellChecker.correct(word)) {
      const corrections = spellChecker.suggest(word);
      return corrections.length > 0 ? corrections[0] : word;
    }
    return word;
  });

  return correctedWords.join(' ');
};