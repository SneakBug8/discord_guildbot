import { Server } from "..";
import { DiscordBot } from "../api/discord";
import { MessageWrapper } from "../MessageWrapper";

const votingRole: string = "818578736172761119";
const required = 2;

class DemocracyServiceClass
{
    private votingChannel: string = "818581956916412466";

    private for = 0;
    private against = 0;
    private issueText = "";

    private voted: string[] = [];

    public async processMessage(msg: MessageWrapper)
    {
        if (msg.message.channel.id !== this.votingChannel) {
            return;
        }

        if (!msg.message.guild || !Server.guildIds.includes(msg.message.guild.id)) {
            return;
        }

        const member = msg.message.member;
        if (!member || !member.roles.cache.has(votingRole)) {
            return;
        }

        if (new RegExp("!issue (.+)").test(msg.message.content)) {
            const matches = new RegExp("!issue (.+)").exec(msg.message.content);

            if (matches && matches.length) {
                this.issueText = matches[1];
                this.against = 0;
                this.for = 0;
                Server.SendMessage(this.votingChannel,
                    `<@&${votingRole}>, открыто голосование по вопросу "${this.issueText}"`);
            }
        }

        if (this.voted.includes(msg.message.author.id)) {
            msg.reply("Вы уже голосовали.");
            return
        }
        if (new RegExp("!for").test(msg.message.content)) {
            this.for += 1;
            this.voted.push(msg.message.author.id);
            msg.reply(`За ✔: ${this.for}. Против ❌: ${this.against}`);
        }
        if (new RegExp("!against").test(msg.message.content)) {
            this.against += 1;
            this.voted.push(msg.message.author.id);
            msg.reply(`За ✔: ${this.for}. Против ❌: ${this.against}`);
        }
        if (new RegExp("!now").test(msg.message.content)) {
            msg.reply(`За ✔: ${this.for}. Против ❌: ${this.against}`);
        }

        if (this.for >= required) {
            msg.reply(`Проект "${this.issueText}" принят 🎉🎉🎉.`);
            this.for = 0;
            this.against = 0;
            this.issueText = "";
        }
    }
}

export const DemocracyService = new DemocracyServiceClass();