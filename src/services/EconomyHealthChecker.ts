import { Server } from "..";
import { Character } from "../entity/Character";
import { FormatCash } from "../utility/CashFormat";
import { CharacterService } from "./CharacterService";
import { Requisite } from "./Requisites/Requisite";

class EconomyHealthCheckerClass
{
    public BankParts = [
        115, // Сол
        100, // Грей
        65, // Гельмут
        25, // Джио
        10, // Блэк
    ];
    public InBank = 0;

    public async Announce()
    {
        const msg = (await this.Check()).message;
        await Server.SendMessage(Server.mainChannel, msg);
        await Server.SendAdmin(msg);
    }

    public async Check()
    {
        this.InBank = 0;
        for (const part of this.BankParts) {
            this.InBank += part;
        }

        const TotalInEconomy = await Character.TotalCash();
        const totalchars = Character.Active();

        return new Requisite(`Средняя благосклонность (активных) - ${FormatCash(TotalInEconomy / (await totalchars).length)}.`);

        /*if (TotalInEconomy <= this.InBank) {
            await Server.SendMessage(Server.mainChannel,
                `Экономика здорова. Все дукаты подкреплены золотом в банке.`);
        }
        else {
            await Server.SendMessage(Server.mainChannel,
                `Экономика нездорова. ` +
                `Лишь ${(this.InBank * 100 * 100 / TotalInEconomy).toFixed(2)}% дукатов подкреплено золотом.`);
        }*/
    }
}

export const EconomyHealthChecker = new EconomyHealthCheckerClass();
