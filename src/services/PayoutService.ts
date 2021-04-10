import { Server } from "..";
import { backupDatabase } from "../DataBase";
import { Character } from "../entity/Character";
import { Payout } from "../entity/Payout";
import { FormatCash } from "../utility/CashFormat";
import { Logger } from "../utility/Logger";
import { sleep } from "../utility/sleep";
import { AdsService } from "./AdsService";
import { CharacterService } from "./CharacterService";
import { EconomyHealthChecker } from "./EconomyHealthChecker";
import { LootService } from "./LootService";

class PayoutServiceClass
{
    private lastPaid: number;
    private paid: string[] = [];

    public Init()
    {
        this.afterStart();
        setInterval(() => { this.timer(); }, 1000 * 60 * 15);

        Server.RegisterCommand("!payouts", async (msg) =>
        {
            if (msg.message.author.id !== Server.adminId) {
                msg.reply("Вы не администратор для выполнения этого действия.");
                return;
            }

            const payouts = await Payout.All();

            let res = "";
            let i = 1;
            for (const p of payouts) {
                res += `${i++}. ${p.name} - ${FormatCash(p.amount)}.\n`;
            }

            msg.reply(res);
            return true;
        });
    }

    public async afterStart()
    {
        // await sleep(5000);
        // this.timer();
    }

    public async payout()
    {
        await backupDatabase();

        // Естественная убыль
        const chars = await Character.Active();
        let taken = 0;

        for (const c of chars) {
            /*if (this.paid.includes(c.name)) {
                continue;
            }*/

            const amount = Math.ceil(c.cash * 0.1);
            await CharacterService.DestroyCash(c.name, amount, "Inflation");
            taken += amount;
        }

        const payouts = await Payout.All();
        let paid = 0;

        await Server.SendMessages(Server.generalIds, AdsService.GetLine());

        for (const p of payouts) {
            let char = await Character.GetWithName(p.name);

            if (!p.amount) {
                continue;
            }

            if (char && char.injury === 0) {
                await CharacterService.CreateCash(char.name, p.amount, "Payout");
                char = await Character.GetWithName(p.name);

                await Server.SendAdmin(
                    `{} Персонаж ${char.name} получил за службу ${FormatCash(p.amount)} благосклонности.`);
                await Server.SendMessage(Server.mainChannel,
                    `Персонаж ${char.name} получил за службу ${FormatCash(p.amount)} благосклонности.`);
                await Character.SendMessage(char,
                    `Персонаж ${char.name} получил за службу ${FormatCash(p.amount)} благосклонности.` +
                    ` Теперь у него ${char.cash} благосклонности.` +
                    ((char.cash >= LootService.BuyPrice) ?
                        `\nНакопленной благосклонности достаточно для покупки сундука.` : ""));
            }
            else if (char.injury !== 0) {
                await Server.SendAdmin(`{} Персонаж ${char.name} ранен и не может выполнять свои обязанности.`);
                await Server.SendMessage(Server.mainChannel,
                    `Персонаж ${char.name} ранен и не может выполнять свои обязанности.`);
                await Character.SendMessage(char,
                    `Персонаж ${char.name} ранен и не может выполнять свои обязанности.` +
                    ` Обратитесь к лекарям за лечением и пришлите скриншот лечения в канал отчётов.`);
            }
        }

        await Server.SendMessage(Server.mainChannel,
            `За должностные обязанности выдано ${FormatCash(paid)} благосклонности. `
            + `Естественная убыль ${FormatCash(taken)} благосклонности.`);

        if (paid < taken) {
            await Server.SendMessage(Server.mainChannel,
                `https://media.giphy.com/media/1vAaDWLvujuCI/giphy.gif`);
        }
        else {
            await Server.SendMessage(Server.mainChannel,
                `https://media.giphy.com/media/Az8qq276ke2BO/giphy.gif`);
        }

        await EconomyHealthChecker.Announce();
    }

    private timer()
    {
        const now = new Date(Date.now());

        if (now.getHours() === 16 && now.getMinutes() <= 15 && this.lastPaid !== now.getDay()) {
            console.log(now + " payment time");
            this.payout();
            this.lastPaid = now.getDay();
        }
        else {
            console.log(now + " checking for payment");
        }
    }
}

export const PayoutService = new PayoutServiceClass();
