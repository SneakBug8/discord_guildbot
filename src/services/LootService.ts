import { Server } from "..";
import { Character } from "../entity/Character";
import { Item } from "../entity/Item";
import { Loot } from "../entity/Loot";
import { FormatCash } from "../utility/CashFormat";
import { ChannelFilter } from "../utility/ChannelFilter";
import { sleep } from "../utility/sleep";
import { CharacterService } from "./CharacterService";
import { ItemsService } from "./ItemsService";
import { Requisite } from "./Requisites/Requisite";

class LootServiceClass
{
    public BuyPrice = 10;
    public LootboxName = "Lootbox";

    public async RegisterCommands()
    {
        Server.RegisterCommand("!lootbox buy", ChannelFilter(async (msg) =>
        {
            const char = await CharacterService.TryGetForUser(msg.message.author.id);
            msg.reply(char.message);
            if (!char.result) {
                return true;
            }

            const res = await this.Buy(char.data);

            if (res.result) {
                msg.reply(`Персонаж ${char.data.name} успешно купил сундук за ${FormatCash(this.BuyPrice)} благосклонности.`);
            }
            msg.reply(res.message);
            return true;
        }));
        Server.RegisterCommand("!lootbox open", ChannelFilter(async (msg) =>
        {
            const char = await CharacterService.TryGetForUser(msg.message.author.id);

            msg.reply(char.message);
            if (!char.result) {
                return true;
            }

            const res = await this.TryRoll(char.data);
            msg.reply(res.message);
            return true;
        }));
        Server.RegisterCommand("!lootbox give (.+)", async (msg, matches) =>
        {
            if (msg.message.author.id !== Server.adminId) {
                msg.reply("Вы не администратор для выполнения этого действия.");
                return true;
            }

            const char = await Character.GetWithName(matches[1]);

            if (!char) {
                msg.reply("Такого персонажа нет в системе.");
                return true;
            }

            const lootbox = await ItemsService.AddItem(this.LootboxName, char.name);
            Character.SendMessage(char, `Персонажем ${char.name} получен сундук.` +
                `Используйте !lootbox open, чтобы открыть его.`);
            msg.reply(`Персонажу ${char.name} выдан сундук.`);
            return true;
        });
        Server.RegisterCommand("!loot all", async (msg, matches) =>
        {
            if (msg.message.author.id !== Server.adminId) {
                msg.reply("Вы не администратор для выполнения этого действия.");
                return true;
            }
            const res = await this.List(false);
            msg.reply(res.message);
            return true;
        });
        Server.RegisterCommand("!loot$", async (msg, matches) =>
        {
            if (msg.message.author.id !== Server.adminId) {
                msg.reply("Вы не администратор для выполнения этого действия.");
                return true;
            }
            const res = await this.List();
            msg.reply(res.message);
            return true;
        });
        Server.RegisterCommand("!loot add (.+)", async (msg, matches) =>
        {
            if (msg.message.author.id !== Server.adminId) {
                msg.reply("Вы не администратор для выполнения этого действия.");
                return true;
            }

            Loot.Create(matches[1], 1);
            msg.reply(`Создан дроп ${matches[1]}`);
            return true;
        });
        Server.RegisterCommand("!loot set (.+?) *; *([0-9]+)", async (msg, matches) =>
        {
            if (msg.message.author.id !== Server.adminId) {
                msg.reply("Вы не администратор для выполнения этого действия.");
                return true;
            }

            const loot = await Loot.GetWithName(matches[1]);
            if (!loot) {
                msg.reply("Такого лута нет в системе.");
            }

            const amount = Number.parseInt(matches[2], 10);
            loot.amount = amount;
            Loot.Update(loot);

            msg.reply(`У дропа ${loot.name} теперь ${loot.amount} выдач.`);
            return true;
        });
    }

    public async List(filter: boolean = true)
    {
        const loot = (filter) ? await Loot.Lootable() : await Loot.All();
        let res = "";
        let i = 0;
        for (const l of loot) {
            res += `${++i}. ${l.name} - ${l.amount}\n`;
        }
        return new Requisite(res);
    }

    public async TryRoll(char: Character)
    {
        const lootbox = await ItemsService.HasItem(this.LootboxName, char.name);
        if (!lootbox.result) {
            return lootbox;
        }

        const res = await this.Roll(char);

        await Item.Delete(lootbox.data.id);

        return res;
    }

    public async Roll(char: Character)
    {
        const variants = await Loot.Lootable();

        if (!variants.length) {
            return new Requisite().error("Сейчас нет предметов в выдаче. Попробуйте позже.");
        }

        const random = Math.floor(Math.random() * (variants.length + 1));

        const item = variants[random];

        await ItemsService.AddItem(item.name, char.name);

        item.amount--;
        await Loot.Update(item);

        Server.SendAdmin(`Персонаж ${char.name} выбил ${item.name} из сундука.`);
        Server.SendMessages(Server.generalIds, `Персонаж ${char.name} выбил ${item.name} из сундука.\n` +
            `https://media.giphy.com/media/iwVHUKnyvZKEg/giphy.gif`);

        let decoration = "";
        for (let i = 0; i < 5 + Math.random() * 10; i++) {
            decoration += Math.floor(Math.random() * variants.length) + "... ";
        }
        return new Requisite(decoration +
            `\nИз сундука вам выпал ${item.name}.`);
    }

    public async Append(name: string, amount: number)
    {
        const loot = await Loot.Create(name, amount);
        return loot;
    }

    public async Buy(char: Character)
    {

        const res = await CharacterService.DestroyCash(char.name, this.BuyPrice, "Chest purchased");
        if (!res.result) {
            return res;
        }

        await ItemsService.AddItem(this.LootboxName, char.name);

        await sleep(1000);

        const roll = await this.TryRoll(char);

        if (!roll.result) {
            return new Requisite("Приобретён сундук.");
        }

        return roll;
    }
}

export const LootService = new LootServiceClass();
