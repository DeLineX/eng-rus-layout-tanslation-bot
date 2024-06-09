import { engToRusDictionary } from "./eng-to-rus-dictionary.js";

const rusToEngDictionary: Record<string, string> = {};

for (const key in engToRusDictionary) {
  const value = engToRusDictionary[key];
  rusToEngDictionary[value] = key;
}

export { rusToEngDictionary };
