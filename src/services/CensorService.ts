import { Server } from "..";
import { MessageWrapper } from "../MessageWrapper";

export class CensorServiceClass
{
    private word: string = "";
    private Violators = new Map<string, number>();

    public Init()
    {
        Server.RegisterCommand(".*", (msg) => this.checkMessage(msg));
        Server.RegisterCommand("^[^!].*$", this.filterNotCommand);
    }

    public async checkMessage(msg: MessageWrapper): Promise<boolean>
    {
        if (msg.message.channel.type === "dm") {
            await Server.SendAdmin(`[${msg.getPrintableTime()}] ${msg.message.author.tag} ${msg.message.content}`);
            return false;
        }

        // console.log(`Filtering text "${filteredtext}"`);
        const r1 = this.checkString(msg.message.content.toLowerCase());

        let filteredtext = msg.message.content.toLowerCase();

        for (const replacement of replacements) {
            filteredtext = filteredtext.replace(new RegExp(replacement[0], "g"), replacement[1] as string);
        }
        const r2 = r1 || this.checkString(filteredtext);
        if (r2) {
            try {
                this.CountViolation(msg.message.author.id);
                Server.SendAdmin(`[${msg.getPrintableTime()}] {${this.Violators.get(msg.message.author.id)}} ` +
                    `(${msg.message.author.username}) ${msg.message.content}`);

                await Server.SendPM(msg.message.author.id, "Не нужно мата в нашем чате: " + this.word +
                    `. Можно огрести по шапке за ${this.Violators.get(msg.message.author.id)} раз.\n` +
                    `https://media.giphy.com/media/10dnNMNdFQSt5C/giphy.gif`);

                await msg.message.delete();
                return true;
            }
            catch (e) {
                console.error(e);
            }
        }

        return false;
    }

    private async filterNotCommand(msg: MessageWrapper): Promise<boolean>
    {
        return true;
    }

    private CountViolation(userId: string)
    {
        this.Violators.set(userId, (this.Violators.get(userId) || 0) + 1);
    }

    private checkString(text: string)
    {
        for (const regex of censorRegexes) {
            let del = false;
            const first = regex[0];

            // test positive
            if (new RegExp(first).test(text)) {
                del = true;
                this.word = first;
            }
            else {
                continue;
            }

            // test negative
            if (regex.length > 1) {
                for (let i = 1; i < regex.length; i++) {
                    const next = regex[i];
                    if (new RegExp(next).test(text)) {
                        del = false;
                        continue;
                    }
                }
            }

            if (del) {
                return true;
            }
        }

        return false;
    }
}

const censorRegexes = [
    ["fuck"],
    ["хуй"],
    ["хуе"],
    ["мудак"],
    ["мудоз"],
    ["гондон"],
    ["гандон"],
    ["педер"],
    ["хер"],
    ["бля", "бля.", "абля"],
    ["бляд"],
    ["блят", "любля"],
    ["соси"],
    ["сука"],
    ["сучи[й]"],
    ["сучь[яа]"],
    ["shit"],
    ["asshole"],
    ["bitch"],
    ["пидор"],
    ["пидар"],
    ["залуп"],
    ["пыдор"],
    ["нигг"],
    ["йоба"],
    ["хырня"],
    ["пизде"],
    ["пизду"],
    ["пиздю"],
    ["пиздо"],
    ["пизде"],
    ["пизда"],
    ["пизды"],
    ["пизди"],
    ["пиздя"],
    ["ебыв"],
    ["ебан"],
    ["ебен", "ребен"],
    ["уеб"],
    ["ебал"],
    ["ебл"],
    ["( |^)еба", "чеба"],
    ["ебуч"],
    ["ебка"],
    ["ебне"],
    ["ебат"],
    ["ебис"],
    ["ебаш"],
    ["ебет"],
    ["ебит"],
    ["ебеш", "гребеш"],
    ["заеб"],
    ["гандон"],
    ["ебну"],
    ["шлюх"],
    ["долбо"],
    ["писюн"],
    ["письк"],
    ["конча", "конча."],
    ["кончать"],
    ["куколд"],
    ["cuckold"],
    ["cum"],
    ["кончить", "( |^)кончить", "кончитьс"],
    ["( |^)конч", "( |^)кончил", "кончилс"],
    ["кончил( |$)", "( |^)кончил", "кончилс", "кончилис"],
    ["фак( |$)"],
    ["( |^)хуя( |$)"],

];

const replacements = [
    ["a", "а"],
    ["k", "к"],
    ["c", "с"],
    ["o", "о"],
    ["y", "у"],
    ["e", "е"],
    ["3", "е"],
    ["ё", "е"],
    ["e", "е"],
    ["u", "у"],
    ["m", "м"],
    ["x", "х"],
    ["[-+!)(*&%$#@)]", ""],
];

export const CensorService = new CensorServiceClass();
