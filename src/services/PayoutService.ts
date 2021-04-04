import { Server } from "..";
import { Character } from "../entity/Character";
import { Payout } from "../entity/Payout";
import { FormatCash } from "../utility/CashFormat";
import { sleep } from "../utility/sleep";
import { CharacterService } from "./CharacterService";
import { EconomyHealthChecker } from "./EconomyHealthChecker";

class PayoutServiceClass
{
    lastPaid: number;
    public Init()
    {
        this.afterStart();
        setInterval(() => { this.timer(); }, 1000 * 60 * 30);

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
        await sleep(5000);
        this.timer();
    }

    private paid: string[] = [];

    public async payout()
    {
        const payouts = await Payout.All();
        let paid = 0;

        for (const p of payouts) {
            const char = await Character.GetWithName(p.name);
            if (char && char.injury === 0 && p.amount > 0) {
                char.cash += p.amount;
                paid += p.amount;

                this.paid.push(char.name);

                await Character.Update(char);

                await Server.SendAdmin(`{} Персонаж ${char.name} получил за службу ${FormatCash(p.amount)} дукатов.`);
                /*await Server.SendMessage(Server.mainChannel,
                    `Персонаж ${char.name} получил за службу ${FormatCash(p.amount)} дукатов.`);*/
                await Character.SendMessage(char,
                    `Персонаж ${char.name} получил за службу ${FormatCash(p.amount)} дукатов.`);
            }
        }

        // Инфляция
        const chars = await Character.All();
        const cashbefore = (await Character.GetWithName(CharacterService.BinCharacter)).cash;

        for (const c of chars) {
            /*if (this.paid.includes(c.name)) {
                continue;
            }*/

            const amount = Math.ceil(c.cash * 0.01);

            await CharacterService.TransferCash(c.name, CharacterService.BinCharacter, amount);
        }

        const cashafter = (await Character.GetWithName(CharacterService.BinCharacter)).cash;

        await Server.SendMessage(Server.mainChannel,
            `Выплачено зарплат на ${FormatCash(paid)} дуката. `
            + `Инфляционные сборы составили ${FormatCash(cashafter - cashbefore)} дукатов.`);

        if (paid < (cashafter - cashbefore)) {
            await Server.SendMessage(Server.mainChannel,
                `https://media.giphy.com/media/Az8qq276ke2BO/giphy.gif`);
        }
        else {
            await Server.SendMessage(Server.mainChannel,
                `https://media.giphy.com/media/1vAaDWLvujuCI/giphy.gif`);
        }

        await EconomyHealthChecker.Announce();
    }

    private timer()
    {
        const now = new Date(Date.now());

        if (now.getHours() === 18 && this.lastPaid !== now.getDay()) {
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