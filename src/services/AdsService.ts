import { FormatCash } from "../utility/CashFormat";
import { LootService } from "./LootService";

class AdsServiceClass
{
    public GetLine()
    {
        const rand = Math.floor(Math.random() * 2);

        if (rand === 0) {
            return `Всего за ${FormatCash(LootService.BuyPrice)} благосклонности ` +
                `ваш персонаж может приобрести сундук ` +
                `со случайным предметом, который пригодится ему в бою: бонусные роллы, лечение и АоЕ атаки ждут.`;
        }
        else {
            return `Персонажи зарабатывают благосклонность за службу или выполнение полезных действий: ` +
            `походы на ивенты, сдача вещей на склад или вербовку.`;
        }
    }
}

export const AdsService = new AdsServiceClass();
