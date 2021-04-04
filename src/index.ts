import * as dotenv from "dotenv";
import { DiscordBot } from "./api/discord";
import { CensorService } from "./services/CensorService";
import * as Discord from "discord.js";

import { Load } from "./moduleloader";

dotenv.config();

import { MessageWrapper } from "./MessageWrapper";
import { DemocracyService } from "./services/DemocracyService";
import { CharacterService } from "./services/CharacterService";
import { HelpService } from "./services/HelpService";
import { TimeskipService } from "./services/TimeskipService";
import { FormatCash } from "./utility/CashFormat";
import { Logger } from "./utility/Logger";
import { PayoutService } from "./services/PayoutService";
import { TextChannel } from "discord.js";
import { LootService } from "./services/LootService";
import { ItemsService } from "./services/ItemsService";
import { TaskService } from "./services/TaskService";

function sleep(ms: number)
{
    return new Promise((resolve) =>
    {
        setTimeout(resolve, ms);
    });
}

class App
{
    public mainChannel: string = "819154184992456764";
    public channelIds: string[] = ["819154184992456764", /*"821033166058946610"*/];
    public generalIds: string[] = ["818578437325193290"/*, "807933548505333805"*/];
    public adminId: string = "156979394953478144";
    public adminDM: string = "465984266430447616";
    public guildIds: string[] = ["818578437325193286", /*"807933548505333802"*/];

    public welcomeMessage = `Для регистрации посети канал <#818581399891869737>.\n` +
        `В каналах <#818579134677778442> и <#818580902330236928> ты найдёшь всю важную информацию о гильдии.\n` +
        `Для открытия счёта благосклонности, напиши !register (имя персонажа) в <#819154184992456764>`;

    public Commands: ICommand[] = [];

    public constructor()
    {
        DiscordBot.on("message", async (msg) =>
        {
            try {
                if (DiscordBot.user && msg.author.id === DiscordBot.user.id) {
                    return;
                }

                const message = new MessageWrapper(msg);
                const time = message.getPrintableTime();

                console.log(`[${time}] ${msg.author.username} ${msg.content}`);

                for (const c of this.Commands) {
                    const regexp = new RegExp(c.regexp, "i");
                    if (regexp.test(message.message.content)) {
                        const matches = regexp.exec(message.message.content);
                        const r = await c.handler(message, matches);
                        if (r) {
                            return;
                        }
                    }
                }

                const h = await HelpService.checkMessage(message);
                if (h) { return; }

                if (msg.channel.type !== "dm" && !this.channelIds.includes(msg.channel.id)) {
                    return;
                }

                await DemocracyService.processMessage(message);
            }
            catch (e) {
                this.SendAdmin(e || "Unknown exception");
            }
        });
        DiscordBot.on("messageUpdate", async (msg) =>
        {
            try {
                if (DiscordBot.user && msg.author.id === DiscordBot.user.id) {
                    return;
                }
                const newmsg = await msg.fetch(true);
                console.log(`Message edited to ${newmsg.content}`);

                const message = new MessageWrapper(newmsg);

                CensorService.checkMessage(message);
            }
            catch (e) {
                this.SendAdmin(e || "Unknown exception");
            }
        });
        DiscordBot.on("guildMemberAdd", (member) =>
        {
            console.log(`User ${member.nickname} joined server`);
            const channel = member.guild.channels.cache.find(ch => ch.id === "818581414437060640");
            // Do nothing if the channel wasn't found on this server
            if (!channel) { return; }
            // Send the message, mentioning the member
            (channel as TextChannel).send(`Добро пожаловать на судно, ${member}!\n` + this.welcomeMessage);
            // member.send(`Добро пожаловать на судно, ${member}!\n` + this.welcomeMessage);
        });
        DiscordBot.on("guildMemberRemove", (member) =>
        {
            console.log(`User ${member.nickname} left server`);
            const channel = member.guild.channels.cache.find(ch => ch.id === "818581414437060640");
            // Do nothing if the channel wasn't found on this server
            if (!channel) { return; }
            // Send the message, mentioning the member
            (channel as TextChannel).send(`${member.user.username} покинул корабль...`);
            // member.send(`Добро пожаловать на судно, ${member}!\n` + this.welcomeMessage);
        });
    }

    public RegisterCommand(regexp: string,
        handler: (message: MessageWrapper, matches: RegExpExecArray) => Promise<boolean>)
    {
        this.Commands.push({
            regexp,
            handler
        });
    }

    public async SendMessages(channelids: string[], text: string)
    {
        const msgs: MessageWrapper[] = [];
        if (text) {
            for (const id of channelids) {
                msgs.push(await this.SendMessage(id, text));
            }
        }
        return msgs;
    }

    public async SendPM(userId: string, text: string)
    {
        Logger.info(`1 | ${text}`);
        if (text) {
            const user = await DiscordBot.users.fetch(userId) as Discord.User;

            const msg = await user.send(text);
            return new MessageWrapper(msg);
        }
        return null;
    }

    public async SendMessage(channelid: string, text: string)
    {
        Logger.info(`2 | ${text}`);
        if (text) {
            const channel = await DiscordBot.channels.fetch(channelid) as any as Discord.TextChannel;
            if (channel.type !== "text" && channel.type !== "dm") {
                return;
            }

            const msg = await channel.send(text);
            return new MessageWrapper(msg);
        }
        return null;
    }

    public async SendAdmin(text: string)
    {
        return this.SendMessage(this.adminDM, text);
    }
}

interface ICommand
{
    regexp: string;
    handler: (message: MessageWrapper, matches: RegExpExecArray) => Promise<boolean>;
}

export const Server = new App();

PayoutService.Init();
CensorService.Init();
TimeskipService.Init();
CharacterService.Init();
LootService.RegisterCommands();
ItemsService.RegisterCommands();
TaskService.Init();

console.log("Bot started");
