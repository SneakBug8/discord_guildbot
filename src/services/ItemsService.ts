import { Server } from "..";
import { Item } from "../entity/Item";
import { ChannelFilter } from "../utility/ChannelFilter";
import { CharacterService } from "./CharacterService";
import { Requisite } from "./Requisites/Requisite";

class ItemsServiceClass
{
    public async RegisterCommands()
    {
        Server.RegisterCommand("!items$", ChannelFilter(async (msg) =>
        {
            const char = await CharacterService.TryGetForUser(msg.message.author.id);

            msg.reply(char.message);
            if (!char.result) {
                return true;
            }

            const items = await this.ListItems(char.data.name);
            let res = "";
            let i = 0;
            for (const item of items) {
                res += ++i + ". " + item.name + "\n";
            }
            if (res.length) {
                msg.reply(res);
            }
            else {
                msg.reply(`У персонажа ${char.data.name} нет предметов.`);
            }
            return true;
        }));
        Server.RegisterCommand("!items (.+)", async (msg, matches) =>
        {
            if (msg.message.author.id !== Server.adminId) {
                msg.reply("Вы не администратор для выполнения этого действия.");
                return;
            }

            const char = await CharacterService.TryGetCharacterByName(matches[1]);

            if (!char.result) {
                msg.reply(char.message);
                return true;
            }

            const items = await this.ListItems(char.data.name);
            let res = "";
            let i = 0;
            for (const item of items) {
                res += `${++i}. ${item.id} ${item.name}\n`;
            }
            if (res.length) {
                msg.reply(res +
                `\nhttps://media.giphy.com/media/3oEjI1erPMTMBFmNHi/giphy.gif`);
            }
            else {
                msg.reply(`У персонажа ${char.data.name} нет предметов.` +
                `\nhttps://media.giphy.com/media/3o72EU6W6bOv2mKw0g/giphy.gif`);
            }
            return true;
        });
        Server.RegisterCommand("!items remove (.+?),([0-9]+)", async (msg, matches) =>
        {
            if (msg.message.author.id !== Server.adminId) {
                msg.reply("Вы не администратор для выполнения этого действия.");
                return;
            }

            const char = await CharacterService.TryGetCharacterByName(matches[1]);
            const itemid = Number.parseInt(matches[2], 10);

            if (!char.result) {
                msg.reply(char.message);
                return true;
            }

            const item = await Item.GetById(itemid);

            if (!item) {
                msg.reply("Нет такого предмета");
            }
            msg.reply(`У персонажа ${char.data.name} удалён предмет ${item.name}.`);
            Item.Delete(item.id);
            return true;
        });
        Server.RegisterCommand("!items remove (.+?),(.+)", async (msg, matches) =>
        {
            if (msg.message.author.id !== Server.adminId) {
                msg.reply("Вы не администратор для выполнения этого действия.");
                return true;
            }

            const char = await CharacterService.TryGetCharacterByName(matches[1]);
            const itemname = matches[2];

            if (!char.result) {
                msg.reply(char.message);
                return true;
            }

            const item = await this.HasItem(itemname, char.data.name);

            if (!item.result) {
                msg.reply("Нет такого предмета");
            }
            Item.Delete(item.data.id);
            msg.reply(`У персонажа ${char.data.name} удалён предмет ${item.data.name}.`);
            return true;
        });
    }

    public async AddItem(name: string, owner: string)
    {
        const item = await Item.Create(name, owner);
        return item;
    }

    public async HasItem(name: string, owner: string)
    {
        const item = await Item.GetWithNameAndOwner(name, owner);

        if (item) {
            return new Requisite(item);
        }

        return new Requisite().error(`У персонажа ${owner} нет предмета ${name}.`);
    }

    public async ListItems(owner: string)
    {
        const item = await Item.GetWithOwner(owner);
        return item;
    }
}

export const ItemsService = new ItemsServiceClass();
