import fs from 'fs';

const mapping = JSON.parse(fs.readFileSync('./tarot-mapping.json', 'utf-8'));
const ids = fs.readFileSync('./ids.txt', 'utf-8').split('\n').filter(id => id.trim() !== '');
const cardsFile = fs.readFileSync('./src/cards.ts', 'utf-8');

// Extract current meanings
const meanings: Record<string, { meaning: string, reversedMeaning: string }> = {};
const cardRegex = /name: '([^']+)', meaning: '([^']+)', reversedMeaning: '([^']+)'/g;
let match;
while ((match = cardRegex.exec(cardsFile)) !== null) {
  meanings[match[1]] = { meaning: match[2], reversedMeaning: match[3] };
}

// Add missing meaning for Two of Wands if it's not there
if (!meanings['Two of Wands']) {
  meanings['Two of Wands'] = {
    meaning: 'Future planning, progress, decisions.',
    reversedMeaning: 'Fear of unknown, lack of planning.'
  };
}

const newCards = mapping.order.map((name, index) => {
  const m = meanings[name] || { meaning: '', reversedMeaning: '' };
  return `  { id: '${index}', name: '${name}', meaning: '${m.meaning}', reversedMeaning: '${m.reversedMeaning}', image: getDriveLink('${ids[index]}') }`;
});

const newContent = `export interface TarotCard {
  id: string;
  name: string;
  meaning: string;
  reversedMeaning: string;
  image: string;
}

const getDriveLink = (id: string) => \`https://lh3.googleusercontent.com/d/\${id}\`;

export const TAROT_CARDS: TarotCard[] = [
${newCards.join(',\n')}
];
`;

fs.writeFileSync('./src/cards.ts', newContent);
console.log('src/cards.ts updated successfully');
