import * as Discord from "discord.js";
import { Intents } from "discord.js";
import { Server } from "..";
import { sleep } from "../utility/sleep";
export const DiscordBot = new Discord.Client({
    ws: { intents: [Intents.NON_PRIVILEGED, "GUILD_MEMBERS"] },
});

DiscordBot.on("ready", async () =>
{
    await ClearOldMessages();
    await sleep(2000);

    // Server.SendMessages(Server.channelIds, "Бот перезапущен. Вам потребуется перелогиниться.");
    console.log(`Logged in as ${DiscordBot.user.tag}!`);

    setInterval(() => ClearOldMessages(), 60 * 1000);
});

async function ClearOldMessages()
{
    if (DiscordBot.user) {
        for (const channelId of Server.channelIds) {
            const channel = await DiscordBot.channels.fetch(channelId) as any as Discord.TextChannel;
            if (channel.type !== "text" && channel.type !== "dm") {
                return;
            }
            const messages = (await channel.messages.fetch()).array();
            for (const msg of messages) {
                if (msg.createdTimestamp < Date.now() - 60 * 60 * 1000) {
                    channel.messages.delete(msg);
                }
            }
        }
    }
}

DiscordBot.on("message", (msg) =>
{
    if (msg.content === "ping") {
        msg.reply("Pong!");
    }
});

DiscordBot.login("MjUwMjY2MjA4MDU2NzcwNTcw.WDMEkQ.ovkYF7VeppSLVsgbf2hOVLtpSLo");
