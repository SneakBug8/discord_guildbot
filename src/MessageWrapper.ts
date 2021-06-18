import TelegramBot = require("node-telegram-bot-api");
import { BotAPI } from "./api/bot";
import * as Discord from "discord.js";
import dateFormat = require("dateformat");
import { DiscordBot } from "./api/discord";
import { Logger } from "./utility/Logger";

export class MessageWrapper
{
    public message: Discord.Message | Discord.PartialMessage;
    public scheduledForDeletion: boolean = false;

    constructor(message: Discord.Message | Discord.PartialMessage)
    {
        this.message = message;
    }

    public deleteAfterTime(minutes: number = 5)
    {
        if (!this.scheduledForDeletion) {
            this.scheduledForDeletion = true;
            setTimeout(() =>
            {
                console.log(`Deleting message "${this.message.content}"`);
                if (this.message.channel.type === "text") {
                    this.message.delete();
                }
            }, 1000 * 60 * minutes);
        }

        return this;
    }

    public async reply(text: string)
    {
        if (!text) {
            return;
        }

        const r = await this.message.reply(text);
        return new MessageWrapper(r);
    }

    public async replyMany(texts: string[])
    {
        const res = [];
        for (const message of texts) {
            const msg = await this.reply(message);
            res.push(msg);
        }
        return res;
    }

    public checkRegex(regexp: RegExp)
    {
        if (!this.message.content) {
            return false;
        }

        return regexp.test(this.message.content);
    }

    public captureRegex(regexp: RegExp)
    {
        if (!this.message.content) {
            return undefined;
        }

        const captures = regexp.exec(this.message.content);

        if (!captures) { return undefined; }

        return captures;
    }

    public getPrintableTime()
    {
        const now = this.message.createdTimestamp;
        return dateFormat(now, "HH:MM");
    }
}
