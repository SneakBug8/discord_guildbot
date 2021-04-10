import { Server } from "..";
import { WordBan } from "../entity/WordBan";
import { WordException } from "../entity/WordException";
import { MessageWrapper } from "../MessageWrapper";
import { TimeskipService } from "./TimeskipService";

export class CensorServiceClass
{
    private word: string = "";
    private Violators = new Map<string, number>();

    public Init()
    {
        Server.RegisterCommand(".*", (msg) => this.checkMessage(msg));
        Server.RegisterCommand("^[^!].*$", this.filterNotCommand);
        Server.RegisterCommand("!ban (.+)", TimeskipService.AdminFilter(this.banCommand));
        Server.RegisterCommand("!exception (.+)", TimeskipService.AdminFilter(this.exceptionCommand));
    }

    public async checkMessage(msg: MessageWrapper): Promise<boolean>
    {
        if (msg.message.channel.type === "dm") {
            await Server.SendAdmin(`[${msg.getPrintableTime()}] ${msg.message.author.tag} ${msg.message.content}`);
            return false;
        }

        let filteredtext = msg.message.content.toLowerCase();

        // console.log(`Filtering text "${filteredtext}"`);
        let res = false;
        res = res || await this.DbFilter(filteredtext);
        res = res || this.checkString(filteredtext);

        if (!res) {
            for (const replacement of replacements) {
                filteredtext = filteredtext.replace(new RegExp(replacement[0], "g"), replacement[1] as string);
            }
            res = res || this.checkString(filteredtext);
        }

        if (res) {
            try {
                this.CountViolation(msg.message.author.id);
                Server.SendAdmin(`[${msg.getPrintableTime()}] {${this.Violators.get(msg.message.author.id)}} ` +
                    `(${msg.message.author.username}) ${msg.message.content} | pattern ${this.word}`);

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

    private async banCommand(msg: MessageWrapper, matches: RegExpExecArray): Promise<boolean>
    {
        const match = matches[1];

        await WordBan.Create("% " + match + " %");

        msg.reply(`Добавил запрет на фразу "${match}"`);
        return true;
    }

    private async exceptionCommand(msg: MessageWrapper, matches: RegExpExecArray): Promise<boolean>
    {
        const match = matches[1];

        await WordException.Create("%" + match + "%");

        msg.reply(`Добавил исключение на фразу "${match}"`);
        return true;
    }

    private CountViolation(userId: string)
    {
        this.Violators.set(userId, (this.Violators.get(userId) || 0) + 1);
    }

    private async DbFilter(value: string)
    {
        const matches = await WordBan.MatchAll(value);

        for (const match of matches) {
            this.word = match.Match;

            const regex = match.Match.replace("%", ".*(")
            .replace("%", ").*")
            .replace(new RegExp("_"), ".");

            const found = new RegExp(regex).exec(value);

            if (!found || found.length < 2) {
                this.AddBanOccurence(match);
                return true;
            }

            const exceptions = await WordException.MatchAll(found[1]);

            if (!exceptions || exceptions.length > 0) {
                this.AddExceptionOccurence(exceptions[0]);
                continue;
            }

            this.AddBanOccurence(match);
            return true;
        }

        return false;
    }

    private async AddBanOccurence(wordban: WordBan)
    {
        wordban.Occured++;
        await WordBan.Update(wordban);
    }

    private async AddExceptionOccurence(exception: WordException)
    {
        exception.Occured++;
        await WordException.Update(exception);
    }

    private checkString(text: string)
    {
        let del = false;

        for (const regex of censorRegexes) {
            const first = regex[0];

            // test positive
            if (new RegExp(first).test(text)) {
                del = true;
                this.word = new RegExp("(" + first + ")").exec(text)[1];
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
        }

        return del;
    }
}

const censorRegexes = [
    ["fuck"],
    ["хуй"],
    ["хули"],
    ["хуе"],
    ["мудак"],
    ["мудоз"],
    ["гондон"],
    ["гандон"],
    ["педер"],
    ["хер"],
    ["бля+", "абля", "любля", "потре"],
    ["соси( |$)"],
    ["сука"],
    ["сран"],
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
    ["ебыв", "стеб", "пребыв"],
    ["ебан", "стеб"],
    ["ебен", "ребен"],
    ["уеб"],
    ["ебал", "стеб"],
    ["ебл", "стеб", "употребл"],
    ["( |^)еба", "чеба"],
    ["ебуч", "стеб", "хлеб"],
    ["ебка", "стеб", "хлеб"],
    ["ебне", "стеб", "хлеб"],
    ["ебат", "стеб", "хлеб"],
    ["ебис", "стеб", "хлеб"],
    ["ебаш", "стеб", "хлеб"],
    ["ебет", "ребет"],
    ["ебит", "стеб"],
    ["ебеш", "гребеш", "стеб"],
    ["заеб"],
    ["гандон"],
    ["ебну"],
    ["шлюх"],
    ["долбо"],
    ["писюн"],
    ["письк"],
    ["писко"],
    ["конча", "конча."],
    ["кончать"],
    ["куколд"],
    ["cuckold"],
    ["cum"],
    ["кончить", ".кончить", "кончитьс"],
    ["( |^)конч([ а]|$)"],
    ["( |^)кончил([ а]|$)", "кончилс"],
    ["( *|^)кончил( *|$)", ".кончил", "кончилс", "кончилис"],
    ["( |^)хуя( |$)"],
    ["( |^)фа+к( |$)"]

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
    ["w", "в"],
    ["n", "п"],
    ["[-+!)(*&%$#@)]", ""],
    ["0", "о"]
];

export const CensorService = new CensorServiceClass();
