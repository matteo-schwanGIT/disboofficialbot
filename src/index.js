'use strict';

const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config');

const TOKEN = config.TOKEN;
const PREFIX = config.PREFIX || '!';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();
client.prefix = PREFIX;

// ensure commands folder exists
const commandsPath = path.join(__dirname, 'commands');
if (!fs.existsSync(commandsPath)) fs.mkdirSync(commandsPath, { recursive: true });

// load commands recursively
function loadCommands(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) loadCommands(full);
    else if (file.endsWith('.js')) {
      try {
        const cmd = require(full);
        if (cmd && cmd.name) client.commands.set(cmd.name, cmd);
      } catch (err) {
        console.error('Failed to load command', full, err);
      }
    }
  }
}
loadCommands(commandsPath);

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity(`${PREFIX}help`, { type: 'LISTENING' });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(client.prefix)) return;

  const args = message.content.slice(client.prefix.length).trim().split(/\s+/);
  const cmdName = args.shift().toLowerCase();
  const command = client.commands.get(cmdName) || client.commands.find(c => c.aliases && c.aliases.includes(cmdName));
  if (!command) return;

  try {
    await command.execute(client, message, args);
  } catch (err) {
    console.error('Command error:', err);
    message.reply('Es gab einen Fehler beim Ausführen des Befehls.');
  }
});

client.login(TOKEN).catch(err => console.error('Login failed:', err));

module.exports = client;