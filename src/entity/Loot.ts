import { DiscordBot } from "../api/discord";
import { Connection } from "../DataBase";
import { Logger } from "../utility/Logger";

export class Loot
{
    public static async From(dbobject: any): Promise<Loot>
    {
        const res = new Loot();
        res.id = dbobject.id;
        res.name = dbobject.name;
        res.amount = dbobject.amount;

        return res;
    }

    public static async GetById(id: number): Promise<Loot>
    {
        const data = await LootRepository().select().where("id", id).first();

        if (data) {
            return this.From(data);
        }

        return null;
    }

    public static async GetWithName(id: string): Promise<Loot>
    {
        const data = await LootRepository().select().where("name", id).first();

        if (data) {
            return this.From(data);
        }

        return null;
    }

    public static async Exists(id: number): Promise<boolean>
    {
        const res = await LootRepository().count("id as c").where("id", id).first() as any;

        return res.c > 0;
    }

    public static async Update(Loot: Loot)
    {
        await LootRepository().where("id", Loot.id).update({
            name: Loot.name,
            amount: Loot.amount,
        });
    }

    public static async Create(name: string, amount: number): Promise<number>
    {
        const loot = new Loot();
        loot.name = name;
        loot.amount = amount;

        return this.Insert(loot);
    }

    public static async Insert(loot: Loot): Promise<number>
    {
        const d = await LootRepository().insert({
            id: loot.id,
            name: loot.name,
            amount: loot.amount,
        });

        loot.id = d[0];

        Logger.info("Created Loot " + loot.id);

        return d[0];
    }

    public static async Delete(id: number): Promise<boolean>
    {
        const Loot = await this.GetById(id);

        await LootRepository().delete().where("id", id);

        Logger.info("Deleted Loot id " + id);

        return true;
    }

    public static async Lootable(): Promise<Loot[]>
    {
        const data = await LootRepository().select().where("amount", ">", "0").orderBy("amount", "desc");
        const res = new Array<Loot>();

        if (data) {
            for (const entry of data) {
                res.push(await this.From(entry));
            }

            return res;
        }

        return [];
    }

    public static async All(): Promise<Loot[]>
    {
        const data = await LootRepository().select().orderBy("amount", "desc");
        const res = new Array<Loot>();

        if (data) {
            for (const entry of data) {
                res.push(await this.From(entry));
            }

            return res;
        }

        return [];
    }

    public id: number;
    public name: string = "";
    public amount: number = 1;
}

export const LootRepository = () => Connection("Loot");