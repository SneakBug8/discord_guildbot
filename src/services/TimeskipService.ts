import { Server } from "..";
import { DiscordBot } from "../api/discord";
import { Character } from "../entity/Character";
import { Payout } from "../entity/Payout";
import { MessageWrapper } from "../MessageWrapper";
import { FormatCash } from "../utility/CashFormat";
import { CharacterService } from "./CharacterService";
import { EconomyHealthChecker } from "./EconomyHealthChecker";
import { PayoutService } from "./PayoutService";
import { Requisite } from "./Requisites/Requisite";

const votingRole: string = "818578736172761119";
const timeskipCash: number = 10;

class TimeskipServiceClass
{
    public Init()
    {
        Server.RegisterCommand("!id <@!([0-9]+)>", async (msg, matches) =>
        {
            msg.reply(msg.message.mentions.members.first().id);
            return true;
        });
        Server.RegisterCommand("!id", async (msg, matches) =>
        {
            msg.reply(msg.message.author.id);
            return true;
        });
        Server.RegisterCommand("!cid", async (msg, matches) =>
        {
            msg.reply(msg.message.channel.id);
            return true;
        });
        Server.RegisterCommand("!gid", async (msg, matches) =>
        {
            msg.reply(msg.message.guild.id);
            return true;
        });

        Server.RegisterCommand("!timeskip", this.AdminFilter(async (msg, matches) =>
        {
            msg.reply((await this.Timeskip()).message);
            return true;
        }));

        Server.RegisterCommand("!economy health", this.AdminFilter(async (msg, matches) =>
        {
            msg.reply((await EconomyHealthChecker.Check()).message);
            return true;
        }));

        Server.RegisterCommand("!payout set (.+) (.+)", this.AdminFilter(async (msg, matches) =>
        {
            const amount = Number.parseInt(matches[2], 10);
            const res = await this.SetPayout(matches[1], amount);
            msg.reply(res.message);
            return true;
        }));
        Server.RegisterCommand("!payout$", this.AdminFilter(async (msg, matches) =>
        {
            PayoutService.payout();
            msg.reply("Выполняю выплаты.");
            return true;
        }));
        Server.RegisterCommand("!kill (.+)", this.AdminFilter(async (msg, matches) =>
        {
            msg.reply((await this.Kill(matches[1])).message);
            return true;
        }));
        Server.RegisterCommand("!injure (.+)", this.AdminFilter(async (msg, matches) =>
        {
            msg.reply((await this.Injure(matches[1])).message);
            return true;
        }));
        Server.RegisterCommand("!heal (.+)", this.AdminFilter(async (msg, matches) =>
        {
            msg.reply((await this.Heal(matches[1])).message);
            return true;
        }));
        Server.RegisterCommand("!register (.+) (.+)", this.AdminFilter(async (msg, matches) =>
        {
            msg.reply((await this.Register(matches[1], matches[2])).message);
            return true;
        }));
        Server.RegisterCommand("!injured", this.AdminFilter(async (msg, matches) =>
        {
            msg.reply((await this.Injured()).message);
            return true;
        }));
        Server.RegisterCommand("!richest", this.AdminFilter(async (msg, matches) =>
        {
            msg.reply((await this.Richest()).message);
            return true;
        }));
        Server.RegisterCommand("!createcash", this.AdminFilter(async (msg, matches) =>
        {
            msg.reply((await this.CreateCash(msg.message.author.id)).message);
            return true;
        }));
        Server.RegisterCommand("^!apay ([a-zA-Zа-яА-Я ]+) ([0-9]+)$", this.AdminFilter(async (msg, matches) =>
        {
            const amount = Number.parseInt(matches[2], 10);

            const res = await CharacterService.CreateCash(matches[1], amount);

            msg.reply(res.message);
            return true;
        }));
    }

    public AdminFilter(decorated)
    {
        return (msg, matches) =>
        {
            const member = msg.message.member;
            if ((!member || !member.roles.cache.has(votingRole)) && msg.message.author.id !== Server.adminId) {
                return false;
            }

            return decorated(msg, matches);
        };
    }

    public async Register(userId: string, name: string)
    {
        const exists = await Character.GetWithName(name);

        if (exists) {
            return new Requisite().error("Персонаж с таким именем уже существует.");
        }
        const character = await Character.Create(name, userId);
        return new Requisite(`Создан персонаж ${name}.`);
    }

    public async SetPayout(name: string, amount: number)
    {
        const suchcharacter = await Character.GetWithName(name);

        if (!suchcharacter) {
            return new Requisite().error("Такого персонажа не существует.");
        }

        const exists = await Payout.GetWithName(name);

        if (exists) {
            exists.amount = amount;
            Payout.Update(exists);
            return new Requisite(`Изменена выплата ${name} на ${FormatCash(amount)}`);
        }

        Payout.Create(name, amount);
        return new Requisite(`Создана выплата ${name} в размере ${FormatCash(amount)}`);
    }

    public async Kill(characterName: string)
    {
        const character = await Character.GetWithName(characterName);

        if (!character) {
            return new Requisite().error("Такого персонажа не существует.");
        }

        character.dead = true;
        Character.Update(character);

        CharacterService.Deauthorize(character);

        return new Requisite().error(`${character.name} теперь мёртв.`);
    }

    public async Injure(characterName: string)
    {
        const character = await Character.GetWithName(characterName);

        if (!character) {
            return new Requisite().error("Такого персонажа не существует.");
        }

        character.injury++;

        if (character.injury > 3) {
            character.dead = true;
            CharacterService.Deauthorize(character);
            Character.SendMessage(character, `Персонаж ${character.name} трагически погиб.`);
        }
        else {
            Character.SendMessage(character, `Персонаж ${character.name} ранен.`);
        }

        Character.Update(character);

        return new Requisite(`${character.name} теперь ранен.`);
    }

    public async Heal(characterName: string)
    {
        const character = await Character.GetWithName(characterName);

        if (!character) {
            return new Requisite().error("Такого персонажа не существует.");
        }

        character.injury--;

        Character.SendMessage(character, `Персонаж ${character.name} поправляется.`);

        Character.Update(character);

        return new Requisite(`${character.name} поправляется.`);
    }

    public async Timeskip()
    {
        const chars = await Character.All();
        for (const char of chars) {
            if (char.injury > 0 && !char.dead) {
                char.injury--;
                Character.Update(char);

                Character.SendMessage(char, `Персонаж ${char.name} поправляется.`);
            }
            else {
                char.ChangeCash(timeskipCash);

                Character.Update(char);
                Character.SendMessage(char, `Персонаж ${char.name} смог немного заработать.`);
            }
        }

        return new Requisite("Таймскип прошёл.");
    }

    public async Injured()
    {
        const chars = await Character.All();
        let text = "";

        for (const char of chars) {
            if (char.injury > 0) {
                text += `${char.name}: ${char.injury}\n`;
            }
        }

        return new Requisite(text);
    }

    public async Richest()
    {
        const chars = await Character.Richest();
        let text = "";

        for (const char of chars) {
            if (!char.dead) {
                text += `${char.name}: ${FormatCash(char.cash)}\n`;
            }
        }

        return new Requisite(text);
    }

    public async CreateCash(userId: string)
    {
        const char = await CharacterService.GetForUser(userId);

        char.ChangeCash(100);
        Character.Update(char);

        return new Requisite("Деньги созданы");
    }
}

export const TimeskipService = new TimeskipServiceClass();
