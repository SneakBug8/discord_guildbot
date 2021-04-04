import { DiscordBot } from "../api/discord";
import { Connection } from "../DataBase";
import { Logger } from "../utility/Logger";

export class Payout
{
    public static async From(dbobject: any): Promise<Payout>
    {
        const res = new Payout();
        res.id = dbobject.id;
        res.name = dbobject.name;
        res.amount = dbobject.amount;

        return res;
    }

    public static async GetById(id: number): Promise<Payout>
    {
        const data = await PayoutRepository().select().where("id", id).first();

        if (data) {
            return this.From(data);
        }

        return null;
    }

    public static async GetWithName(id: string): Promise<Payout>
    {
        const data = await PayoutRepository().select().where("name", id).first();

        if (data) {
            return this.From(data);
        }

        return null;
    }

    public static async Exists(id: number): Promise<boolean>
    {
        const res = await PayoutRepository().count("id as c").where("id", id).first() as any;

        return res.c > 0;
    }

    public static async Delete(id: number): Promise<boolean>
    {
        await PayoutRepository().delete().where("id", id);

        Logger.info("Deleted Payout id " + id);

        return true;
    }

    public static async All(): Promise<Payout[]>
    {
        const data = await PayoutRepository().select().orderBy("amount", "desc");
        const res = new Array<Payout>();

        if (data) {
            for (const entry of data) {
                res.push(await this.From(entry));
            }

            return res;
        }

        return [];
    }

    public static async Update(p: Payout)
    {
        await PayoutRepository().where("id", p.id).update({
            name: p.name,
            amount: p.amount,
        });
    }

    public static async Create(name: string, amount: number): Promise<number>
    {
        const character = new Payout();
        character.name = name;
        character.amount = amount;

        return this.Insert(character);
    }

    public static async Insert(p: Payout): Promise<number>
    {
        const d = await PayoutRepository().insert({
            id: p.id,
            amount: p.amount,
            name: p.name,
        });

        p.id = d[0];

        Logger.info("Created payout " + p.id);

        return d[0];
    }

    public id: number;
    public name: string = "";
    public amount: number = 0;
}

export const PayoutRepository = () => Connection("Payouts");
