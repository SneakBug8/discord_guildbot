import { Character } from "../entity/Character";
import { Requisite } from "./Requisites/Requisite";
import { FormatCash } from "../utility/CashFormat";
import { Server } from "..";
import { ChannelFilter } from "../utility/ChannelFilter";
import { Transaction } from "../entity/Transaction";
import { MessageWrapper } from "../MessageWrapper";
import { Logger } from "../utility/Logger";

const DailyReward = 5;

class CharacterServiceClass
{
    public Users: Array<{ userId: string, characterId: number }> = [];

    public Init()
    {
        Server.RegisterCommand("!characters", ChannelFilter(async (msg) =>
        {
            msg.reply((await this.ListCharacters(msg.message.author.id)).message);
            return true;
        }));
        Server.RegisterCommand("!character (.+)", ChannelFilter(async (msg, matches) =>
        {
            msg.reply((await this.FindCharacter(matches[1])).message);
            return true;
        }));
        Server.RegisterCommand("!player <@.*?([0-9]+).*?>", ChannelFilter(async (msg, matches) =>
        {
            msg.reply((await this.ListOtherCharacters(matches[1])).message);
            return true;
        }));
        Server.RegisterCommand("!register (.+)$", ChannelFilter(async (msg, matches) =>
        {
            msg.reply((await this.Register(msg.message.author.id, matches[1])).message);
            return true;
        }));
        Server.RegisterCommand("!player <@.*?([0-9]+).*?>", ChannelFilter(async (msg, matches) =>
        {
            msg.reply((await this.ListOtherCharacters(matches[1])).message);
            return true;
        }));
        Server.RegisterCommand("!login (.+)", ChannelFilter(async (msg, matches) =>
        {
            msg.reply((await this.Authorize(msg.message.author.id, matches[1])).message);
            return true;
        }));
        Server.RegisterCommand("!cash", ChannelFilter(async (msg) =>
        {
            const character = await this.TryGetForUser(msg.message.author.id);

            msg.reply(character.message);
            if (!character.result) {
                return true;
            }

            msg.reply(`У персонажа ${character.data.name} благосклонность ${FormatCash(character.data.cash)}.\n` +
                `https://media.giphy.com/media/YFn46DerlaOeQ/giphy.gif`);
            return true;
        }));
        Server.RegisterCommand("^!pay ([a-zA-Zа-яА-Я]+) ([0-9\.]+)$", ChannelFilter(async (msg, matches) =>
        {
            const amount = Number.parseFloat(matches[2]);

            const character = await this.TryGetForUser(msg.message.author.id);

            msg.reply(character.message);
            if (!character.result) {
                return;
            }

            const res = await this.PayCash(character.data.name, matches[1], amount, "!pay command");

            msg.reply(res.message);
            return true;
        }));
        Server.RegisterCommand("!health", ChannelFilter(async (msg) =>
        {
            msg.reply((await this.CheckHealth(msg.message.author.id)).message);
            return true;
        }));
        Server.RegisterCommand("!status", ChannelFilter(async (msg) =>
        {
            msg.reply((await this.GetStatus(msg.message.author.id)).message);
            return true;
        }));
        Server.RegisterCommand("!daily", ChannelFilter(async (msg) => this.RedeemDailyRewardCommand(msg)
        ));
    }

    public async Authorize(id: string, charactername: string)
    {
        const character = await Character.GetWithName(charactername);

        if (!character) {
            return new Requisite().error("Нет такого персонажа."
                + "Может, вы хотите зарегистрироваться? Используйте !register (имя персонажа)");
        }

        if (character.userId !== id) {
            return new Requisite().error("Это не ваш персонаж.");
        }

        if (character.dead) {
            return new Requisite().error("Этот персонаж мёртв.");
        }

        this.Login(id, character);

        return new Requisite(`Авторизован как ${character.name}.\n` +
            `https://media.giphy.com/media/3oEjHBhdFg2pqmsWQ0/giphy.gif` +
            (await this.IsDailyAvailable(character.name) ? "Персонажу доступна ежедневная награда," +
            " используйте команду !daily." : ""));
    }

    public Login(id: string, character: Character)
    {
        const existing = this.Users.find((x) => x.userId === id);

        if (existing) {
            existing.characterId = character.id;
        }
        else {
            this.Users.push({
                userId: id,
                characterId: character.id
            });
        }
    }

    public async Register(userId: string, characterName: string)
    {
        const exists = await Character.GetWithName(characterName);
        if (exists) {
            return new Requisite().error("Такой персонаж уже зарегистрирован.");
        }

        await Character.Create(characterName, userId);

        // Приветственный бонус
        // char.cash = 5000;
        // await Character.Update(char);
        /*await Character.SendMessage(char, `Вам начислен приветственный бонус в 50 дукатов. Спасибо, что вы с нами!
Напишите !help, чтобы увидеть список команд бота.`);*/

        await this.Authorize(userId, characterName);

        return new Requisite().error(`Персонаж ${characterName} успешно зарегистрирован.\n` +
            `Используйте команду !help, чтобы увидеть список доступных команд.` +
            `https://media.giphy.com/media/qUXkGxDDSF9CM/giphy.gif`);
    }

    public Deauthorize(character: Character)
    {
        this.Users = this.Users.filter((x) => x.characterId !== character.id);
    }

    public async CreateCash(characterName: string, cash: number, reason: string = "Cash created")
    {
        const character = await Character.GetWithName(characterName);
        if (!character) {
            return new Requisite().error("Нет такого персонажа.");
        }
        character.ChangeCash(cash);

        await Transaction.Create(character.name, cash, reason);

        await Character.Update(character);
        return new Requisite(`Успешно выдано ${cash} благосклонности персонажу ${characterName}.`);
    }

    public async PayCash(from: string, to: string, cash: number, reason: string = "Cash paid between characters")
    {
        const willpay = Math.floor(cash * 0.5);
        const delta = cash - willpay;

        const r1 = await this.TransferCash(from, to, willpay, reason);

        if (!r1.result) {
            return r1;
        }

        return r1;
    }

    public async DestroyCash(from: string, cash: number, reason: string = "Cash destroyed")
    {
        const fromCharacter = await Character.GetWithName(from);

        if (!fromCharacter) {
            return new Requisite().error("Вашего персонажа не существует.");
        }
        if (cash <= 0) {
            return new Requisite().error("Некорректная сумма");
        }

        if (fromCharacter.cash < cash) {
            return new Requisite().error(`Недостаточно средств. ` +
                `Вы можете заработать благосклонность посещением ивентов, работой на гильдию или за механическое золото.`);
        }

        fromCharacter.SetCash(fromCharacter.cash - cash);
        await Character.Update(fromCharacter);

        await Transaction.Create(fromCharacter.name, -cash, reason);

        return new Requisite(`Успешная оплата ${FormatCash(cash)} благосклонности.`);
    }

    public async TransferCash(from: string, to: string, cash: number, reason: string = "Cash transfer")
    {
        const fromCharacter = await Character.GetWithName(from);
        const toCharacter = await Character.GetWithName(to);

        if (!fromCharacter) {
            return new Requisite().error("Вашего персонажа не существует.");
        }
        if (!toCharacter) {
            return new Requisite().error("Персонажа назначения не существует.");
        }

        if (fromCharacter === toCharacter) {
            return new Requisite().error("Нельзя платить самому себе.");
        }

        if (cash <= 0) {
            return new Requisite().error("Некорректная сумма");
        }

        if (fromCharacter.cash <= cash) {
            return new Requisite().error(`Недостаточно средств. ` +
                `Вы можете заработать благосклонность посещением ивентов, работой на гильдию или за механическое золото.`);
        }

        fromCharacter.ChangeCash(- cash);
        toCharacter.ChangeCash(+ cash);
        await Character.Update(fromCharacter);
        await Character.Update(toCharacter);

        await Transaction.Create(fromCharacter.name, -cash, reason);
        await Transaction.Create(toCharacter.name, cash, reason);

        return new Requisite(`Успешная оплата ${FormatCash(cash)} персонажу ${toCharacter.name}`);
    }

    public async GetForUser(userId: string)
    {
        const existing = this.Users.find((x) => x.userId === userId);
        return existing && Character.GetById(existing.characterId);
    }

    public async TryGetForUser(userId: string)
    {
        const existing = await this.GetForUser(userId);

        if (existing) {
            return new Requisite(existing);
        }

        // try autoauthorize
        const characters = await Character.GetWithUserID(userId);
        if (characters.length) {
            this.Login(userId, characters[0]);
            return new Requisite(characters[0])
                .success(`Автоматически авторизован как ${characters[0].name}.` +
                    (await this.IsDailyAvailable(characters[0].name) ? "Персонажу доступна ежедневная награда," +
                        " используйте команду !daily." : ""));
        }

        return new Requisite<Character>().error(`Вы не авторизованы.\n`
            + `https://media.giphy.com/media/wPOARRtwuFG0/giphy.gif`);
    }

    public async TryGetCharacter(id: number)
    {
        const char = await Character.GetById(id);
        if (char) {
            return new Requisite(char);
        }

        return new Requisite().error("Такого персонажа не существует.");
    }

    public async TryGetCharacterByName(name: string)
    {
        const char = await Character.GetWithName(name);
        if (char) {
            return new Requisite(char);
        }

        return new Requisite().error("Такого персонажа не существует.");
    }

    public async CheckHealth(userId: string)
    {
        const character = await this.TryGetForUser(userId);

        if (!character.result) {
            return character;
        }

        let pre = "";
        if (character.message) {
            pre = character.message + "\n";
        }

        if (character.data.dead) {
            return new Requisite(`${pre}${character.data.name} мёртв.\n` +
                `https://media.giphy.com/media/xUA7aSUOSOOsRe74Ri/giphy.gif`);
        }
        else if (character.data.injury >= 3) {
            return new Requisite(`${pre}${character.data.name} должен бы быть мёртвым.\n`
                + `https://media.giphy.com/media/3og0IDCumL5GLx7zag/giphy.gif`);
        }
        else if (character.data.injury === 2) {
            return new Requisite(`${pre}${character.data.name} тяжёло ранен.` +
                `https://media.giphy.com/media/l41YxmyrJHhrz2oBG/giphy.gif`);
        }
        else if (character.data.injury === 1) {
            return new Requisite(`${pre}${character.data.name} легко ранен.\n` +
                `https://media.giphy.com/media/26vUSW6H21dmu2ofK/giphy.gif`);
        }
        else {
            return new Requisite(`${pre}${character.data.name} полностью здоров.\n` +
                `https://media.giphy.com/media/3oD3YGaZEu21s5ymYw/giphy.gif`);
        }
    }

    public async GetStatus(userId: string)
    {
        const character = await this.TryGetForUser(userId);

        if (!character.result) {
            return character;
        }

        let pre = "";
        if (character.message) {
            pre = character.message + "\n";
        }

        pre += `Благосклонность: ${character.data.cash}`;
        pre += `Ранений: ${character.data.injury}`;

        return new Requisite(pre);
    }

    public async FindCharacter(name: string)
    {
        const character = await Character.GetWithName(name);

        if (!character) {
            return new Requisite("Такого персонажа нет в системе.");
        }

        return new Requisite(`Персонаж зарегистрирован и принадлежит <@${character.userId}>`);
    }

    public async ListCharacters(userId: string)
    {
        const characters = await Character.GetWithUserID(userId);

        let text = "";

        if (!characters.length) {
            return new Requisite().error("У вас нет персонажей.");
        }

        for (const char of characters) {
            text += `${char.name}. ${3 - char.injury} здоровья, ${FormatCash(char.cash)} благосклонности.\n`;
        }

        return new Requisite(text);
    }

    public async ListOtherCharacters(userId: string)
    {
        const characters = await Character.GetWithUserID(userId);

        let text = "";

        if (!characters.length) {
            return new Requisite().error("У игрока нет персонажей.");
        }

        for (const char of characters) {
            text += `${char.name}.\n`;
        }

        return new Requisite(text);
    }

    public async IsDailyAvailable(charname: string)
    {
        return !await Transaction.GetDaily(charname, new Date(Date.now()));
    }

    public async RedeemDailyRewardCommand(msg: MessageWrapper)
    {
        const character = await this.TryGetForUser(msg.message.author.id);

        msg.reply(character.message);
        if (!character) {
            return;
        }

        const dailyredeemed = !(await this.IsDailyAvailable(character.data.name));

        if (dailyredeemed) {
            msg.reply(`Персонаж ${character.data.name} уже получил награду сегодня.`);
            return;
        }

        await this.CreateCash(character.data.name, DailyReward, Transaction.DailyReason);

        await Server.SendMessage(Server.mainChannel,
            `Персонаж ${character.data.name} получает ежедневную награду в ${DailyReward}.`);
        msg.reply(`Персонаж ${character.data.name} получает ежедневную награду в ${DailyReward}.`);

        return true;
    }

}

export const CharacterService = new CharacterServiceClass();
