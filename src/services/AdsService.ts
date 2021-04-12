import { FormatCash } from "../utility/CashFormat";
import { LootService } from "./LootService";

class AdsServiceClass
{
    public Lines = [
        `Всего за ${FormatCash(LootService.BuyPrice)} благосклонности ` +
        `ваш персонаж может приобрести сундук ` +
        `со случайным предметом, который пригодится ему в бою: бонусные роллы, лечение и АоЕ атаки ждут.`,
        `Персонажи зарабатывают благосклонность за службу или выполнение полезных действий: ` +
        `походы на ивенты, сдача вещей на склад или вербовку.`,
        `Используйте команду !daily, чтобы получить ежедневную награду для персонажа.`,
        `Неактивные или раненые персонажи теряют 10% благосклонности в день.`,
        `Для получения повышения накопите 100 благосклонности на персонаже.`,
        `Успешное выполнение задания даёт 10 благосклонности персонажу.`,
        `Ремесленник может производить и сдавать товары на склад, чтобы получить благосклонность.`,
        `Позиция офицера - не только привилегии и обязанности, но и увеличенное жалование.`,
    ];

    public GetLine()
    {
        const rand = Math.floor(Math.random() * this.Lines.length);
        return this.Lines[rand];
    }
}

export const AdsService = new AdsServiceClass();
