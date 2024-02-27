import { bold } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import { document, embed } from './config/jvg_12_3.json';
import i18n from './i18n/lv_LV.json';

export default class ScheduleEmbed extends MessageEmbed {
  constructor(sheet) {
    super();

    this.sheet = sheet;

    this.color = embed.color;
    this.description = '';
    this.timestamp = new Date();
    this.author = {
      name: embed.author.name,
      iconURL: embed.author.iconURL,
      url: embed.author.url,
    };
  }

  async build() {
    this.title = `${i18n.class_schedule_on_day} ${this.sheet.title.replace(/a$/, 'u').toLowerCase()}`;

    await this.sheet.loadCells(document.cellRanges.info);
    const info = this.sheet.getCellByA1(document.cellRanges.info).value;
    if (info) {
      this.description += `${bold(i18n.absent)}\n` + info;
    }

    await this.sheet.loadCells(document.cellRanges.classes);
    for (let i = 44; i <= 51; i++) {
      const index = this.sheet.getCellByA1(document.columns.index + i).value;
      const name = this.sheet.getCellByA1(document.columns.name + i).value;
      const teacher = this.sheet.getCellByA1(
        document.columns.teacher + i,
      ).value;

      if (name) {
        this.fields.push({
          name: `${index}. ${name}`,
          value: teacher ? `${teacher}` : '\u200B',
        });
      } else if (teacher) {
        this.footer += `${teacher}\n`;
      }
    }

    if (this.fields.length == 0) {
      this.description += bold(`\n\n${i18n.no_new_schedule}`);
    }

    return this;
  }
}
