import { bold } from '@discordjs/builders';
import { Client, Intents } from 'discord.js';
import 'dotenv/config';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { scheduleJob } from 'node-schedule';
import process from 'process';
import { document, prefix, schedule } from './config/jvg_12_3.json';
import { ScheduleEmbed } from './embed';
import i18n from './i18n/lv_LV.json';

async function getWorksheetDateString(sheet) {
  await sheet.loadCells(document.cells.date);
  const date = sheet.getCellByA1(document.cells.date).stringValue;
  return date;
}

function compareEmbedFields(arr1, arr2) {
  return (
    arr1 !== null &&
    arr2 !== null &&
    arr1.length === arr2.length &&
    arr1.every((field1) =>
      arr2.some(
        (field2) =>
          field1.name === field2.name && field1.value === field2.value,
      ),
    )
  );
}

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.MESSAGE_CONTENT,
  ],
});

const spreadsheet = new GoogleSpreadsheet(document.id, {
  apiKey: process.env.GOOGLE_API_KEY,
});

client.on('ready', async () => {
  console.log(`${i18n.logged_in_as} ${client.user.tag}`);

  await spreadsheet.loadInfo();
  console.log(`${i18n.spreadsheet_name} ${spreadsheet.title}`);

  const channel = await client.channels.fetch(schedule.channel_id);

  let eveningScheduleFields = [];
  let eveningScheduleDescription = null;
  const sendEveningSchedule = async () => {
    const date = new Date();
    let day = date.getDay();
    if (day > 4) {
      day = 0;
    }

    const sheet = spreadsheet.sheetsByIndex[day];
    const embed = await new ScheduleEmbed(sheet).build();
    await channel.send({
      content: `@everyone 🌙 ${i18n.newest_schedule} -- ${await getWorksheetDateString(sheet)}`,
      embeds: [embed],
    });
    eveningScheduleFields = embed.fields;
    eveningScheduleDescription = embed.description;
  };
  scheduleJob(
    'evening_schedule',
    schedule.recurrence_rules.evening,
    sendEveningSchedule,
  );

  const sendMorningSchedule = async () => {
    const date = new Date();
    let day = date.getDay() - 1;
    if (day > 4) {
      day = 0;
    }

    const sheet = spreadsheet.sheetsByIndex[day];
    const embed = await new ScheduleEmbed(sheet).build();

    const areEmbedFieldsEquivalent = compareEmbedFields(
      embed.fields,
      eveningScheduleFields,
    );
    const areDescriptionsEquivalent =
      embed.description === eveningScheduleDescription;

    if (!areEmbedFieldsEquivalent && !areDescriptionsEquivalent) {
      embed.description += bold(`\n${i18n.schedule_absent_changed}`);
    } else if (!areEmbedFieldsEquivalent) {
      embed.description += bold(`\n${i18n.schedule_changed}`);
    } else if (!areDescriptionsEquivalent) {
      embed.description += bold(`\n${i18n.absent_changed}`);
    }

    if (!areEmbedFieldsEquivalent || !areDescriptionsEquivalent) {
      await channel.send({
        content: `@everyone ☀️ ${i18n.newest_schedule} -- ${await getWorksheetDateString(sheet)}`,
        embeds: [embed],
      });
    }

    eveningScheduleFields = null;
    eveningScheduleDescription = null;
  };

  scheduleJob(
    'morning_schedule',
    schedule.recurrence_rules.morning,
    sendMorningSchedule,
  );
});

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'schedule') {
    let day = parseInt(args[0]);
    if (isNaN(day)) {
      const today = new Date().getDay();
      if (today > 5) {
        day = 1;
      } else {
        day = today;
      }
    } else if (day < 1 || day > 5) {
      await message.channel.send(i18n.argument_bounds_error);
      return;
    }
    day--;

    const sheet = spreadsheet.sheetsByIndex[day];
    const embed = await new ScheduleEmbed(sheet).build();
    await message.channel.send({
      embeds: [embed],
    });
  }
});

client.login(process.env.TOKEN);
