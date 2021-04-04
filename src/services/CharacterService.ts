import { Character } from "../entity/Character";
import { Requisite } from "./Requisites/Requisite";
import { FormatCash } from "../utility/CashFormat";
import { Server } from "..";
import { ChannelFilter } from "../utility/ChannelFilter";

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

            if (!character.result) {
                msg.reply(character.message);
                return true;
            }
            if (character.message) {
                msg.reply(character.message);
            }

            msg.reply(`У персонажа ${character.data.name} благосклонность ${FormatCash(character.data.cash)}.\n` +
                `https://media.giphy.com/media/YFn46DerlaOeQ/giphy.gif`);
            return true;
        }));
        Server.RegisterCommand("^!pay ([a-zA-Zа-яА-Я]+) ([0-9\.]+)$", ChannelFilter(async (msg, matches) =>
        {
            const amount = Number.parseFloat(matches[2]);

            const character = await this.GetForUser(msg.message.author.id);

            if (!character) {
                msg.reply("Вы не авторизованы.");
                return;
            }
            const res = await this.PayCash(character.name, matches[1], amount);

            msg.reply(res.message);
            return true;
        }));
        Server.RegisterCommand("!health", ChannelFilter(async (msg) =>
        {
            msg.reply((await this.CheckHealth(msg.message.author.id)).message);
            return true;
        }));
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
            `https://media.giphy.com/media/3oEjHBhdFg2pqmsWQ0/giphy.gif`);
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
            `https://media.giphy.com/media/qUXkGxDDSF9CM/giphy.gif`);
    }

    public Deauthorize(character: Character)
    {
        this.Users = this.Users.filter((x) => x.characterId !== character.id);
    }

    public async CreateCash(characterName: string, cash: number)
    {
        const character = await Character.GetWithName(characterName);
        character.ChangeCash(cash);
        await Character.Update(character);
    }

    public async PayCash(from: string, to: string, cash: number)
    {
        const willpay = Math.floor(cash * 0.5);
        const delta = cash - willpay;

        const r1 = await this.TransferCash(from, to, willpay);

        if (!r1.result) {
            return r1;
        }

        return r1;
    }

    public async DestroyCash(from: string, cash: number)
    {
        const fromCharacter = await Character.GetWithName(from);

        if (!fromCharacter) {
            return new Requisite().error("Вашего персонажа не существует.");
        }
        if (cash <= 0) {
            return new Requisite().error("Некорректная сумма");
        }

        if (fromCharacter.cash <= cash) {
            return new Requisite().error(`Недостаточно средств. ` +
            `Вы можете заработать благосклонность посещением ивентов, работой на гильдию или за механическое золото.`);
        }

        fromCharacter.SetCash(fromCharacter.cash - cash);
        await Character.Update(fromCharacter);

        return new Requisite(`Успешная оплата ${FormatCash(cash)} благосклонности.`);
    }

    public async TransferCash(from: string, to: string, cash: number)
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

        return new Requisite(`Успешная оплата ${FormatCash(cash)} персонажу ${toCharacter.name}`);
    }

    public async GetForUser(userId: string)
    {
        const existing = this.Users.find((x) => x.userId === userId);
        return existing && Character.GetById(existing.characterId);
    }

    public async TryGetForUser(userId: string)
    {
        const existing = this.Users.find((x) => x.userId === userId);

        if (existing) {
            return await this.TryGetCharacter(existing.characterId);
        }

        // try authorize if sole character
        const characters = await Character.GetWithUserID(userId);
        if (characters.length === 1) {
            this.Login(userId, characters[1]);
            return (await this.TryGetCharacter(existing.characterId))
                .success(`Автоматически авторизован как ${characters[1].name}.`);
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

}

export const CharacterService = new CharacterServiceClass();
