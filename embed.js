import { bold } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';

import config from './config/jvg_12_3.json' assert { type: 'json' };
import i18n from './i18n/lv_LV.json' assert { type: 'json' };

export class ScheduleEmbed extends MessageEmbed {
  constructor(sheet) {
    super();

    this.sheet = sheet;

    this.color = config.embed.color;
    this.description = '';
    this.timestamp = new Date();
    this.author = {
      name: config.embed.author.name,
      iconURL: config.embed.author.iconURL,
      url: config.embed.author.url,
    };
  }

  async build() {
    this.title = `${i18n.class_schedule_on_day} ${this.sheet.title.replace(/a$/, 'u').toLowerCase()}`;

    await this.sheet.loadCells(config.document.cellRanges.info);
    const info = this.sheet.getCellByA1(config.document.cellRanges.info).value;
    if (info) {
      this.description += `${bold(i18n.absent)}\n` + info;
    }

    await this.sheet.loadCells(config.document.cellRanges.classes);
    for (let i = 44; i <= 51; i++) {
      const index = this.sheet.getCellByA1(config.document.columns.index + i).value;
      const name = this.sheet.getCellByA1(config.document.columns.name + i).value;
      const teacher = this.sheet.getCellByA1(config.document.columns.teacher + i).value;

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
