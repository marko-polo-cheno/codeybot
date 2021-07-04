import dotenv from 'dotenv';
dotenv.config();

import Discord from 'discord.js';
import yaml from 'js-yaml';
import fs from 'fs';
import Commando from 'discord.js-commando';
import path from 'path';

import { openCommandoDB } from './components/db';
import logger, { logError } from './components/logger';
import { initEmojis } from './components/emojis';

const NOTIF_CHANNEL_ID: string = process.env.NOTIF_CHANNEL_ID || '.';
const BOT_TOKEN: string = process.env.BOT_TOKEN || '.';
const BOT_PREFIX = '.';

// initialize Commando client
const botOwners = yaml.load(fs.readFileSync('config/owners.yml', 'utf8')) as string[];
const client = new Commando.Client({ owner: botOwners, commandPrefix: BOT_PREFIX });
// register command groups
client.registry
  .registerDefaultTypes()
  .registerDefaultGroups()
  .registerDefaultCommands({ unknownCommand: false })
  .registerGroups([
    ['suggestions', 'Suggestions'],
    ['interviews', 'Mock Interviews']
  ])
  .registerCommandsIn(path.join(__dirname, 'commands'));
// set DB provider for persisting bot config
client.setProvider(openCommandoDB().then((db) => new Commando.SQLiteProvider(db))).catch(console.error);

export const startBot = async (): Promise<void> => {
  client.once('ready', async () => {
    // log bot init event and send system notification
    logger.info({
      event: 'init'
    });
    const notif = (await client.channels.fetch(NOTIF_CHANNEL_ID)) as Discord.TextChannel;
    initEmojis(client);
    notif.send('Codey is up!');
  });

  client.on('error', logError);

  client.login(BOT_TOKEN);
};