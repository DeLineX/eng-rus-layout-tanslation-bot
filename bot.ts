import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { engToRusDictionary } from "./src/eng-to-rus-dictionary.js";
import { rusToEngDictionary } from "./src/rus-to-eng-dictionary.js";
import dotenv from "dotenv";

dotenv.config();

const translateMessage = (
  message: string,
  dictionary: Record<string, string>,
): string => {
  const unknownCharacters = new Set<string>();
  let text = "";
  for (const char of message) {
    let encodedChar = dictionary[char];

    if (!encodedChar) {
      const lowerCaseChar = char.toLowerCase();
      if (lowerCaseChar !== char) {
        encodedChar = dictionary[lowerCaseChar]?.toUpperCase();
      }
    }

    if (!encodedChar) {
      unknownCharacters.add(char);
      continue;
    }

    text += encodedChar;
  }

  if (unknownCharacters.size > 0) {
    return `Error, met unknown characters "${[...unknownCharacters].join(", ")}"`;
  }

  return text;
};

const resolvedUpdates: Record<number, boolean> = {};
const saveUpdatesSequence = async (
  update_id: number,
  callback?: () => Promise<unknown>,
) => {
  resolvedUpdates[update_id] = false;
  const isPrevUpdateResolved = () => resolvedUpdates[update_id - 1];

  if (isPrevUpdateResolved() !== undefined) {
    while (!isPrevUpdateResolved()) await new Promise((res) => setTimeout(res));
  }
  await callback?.();
  resolvedUpdates[update_id] = true;
  delete resolvedUpdates[update_id - 1];
};

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.on(message("forward_origin", "text"), async (ctx) => {
  await saveUpdatesSequence(ctx.update.update_id, () =>
    ctx.reply(translateMessage(ctx.message.text, engToRusDictionary)),
  );
});

bot.on(message("text"), async (ctx) => {
  await saveUpdatesSequence(ctx.update.update_id, () =>
    ctx.reply(translateMessage(ctx.message.text, rusToEngDictionary)),
  );
});

bot.launch({
  webhook: {
    domain: process.env.DOMAIN,
    port: +process.env.DOMAIN_PORT,
  },
});

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
