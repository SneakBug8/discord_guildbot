import { DiscordBot } from "../api/discord";
import { Connection } from "../DataBase";
import { Logger } from "../utility/Logger";

export class Item
{
    public static async From(dbobject: any): Promise<Item>
    {
        const res = new Item();
        res.id = dbobject.id;
        res.name = dbobject.name;
        res.owner = dbobject.owner;

        return res;
    }

    public static async GetById(id: number): Promise<Item>
    {
        const data = await ItemRepository().select().where("id", id).first();

        if (data) {
            return this.From(data);
        }

        return null;
    }

    public static async GetWithName(id: string): Promise<Item>
    {
        const data = await ItemRepository().select().where("name", id).first();

        if (data) {
            return this.From(data);
        }

        return null;
    }

    public static async GetWithNameAndOwner(name: string, owner: string): Promise<Item>
    {
        const data = await ItemRepository().select().where("name", name).andWhere("owner", owner).first();

        if (data) {
            return this.From(data);
        }

        return null;
    }

    public static async GetWithOwner(id: string): Promise<Item[]>
    {
        const data = await ItemRepository().select().where("owner", id);
        const res = new Array<Item>();

        if (data) {
            for (const entry of data) {
                res.push(await this.From(entry));
            }

            return res;
        }

        return [];
    }

    public static async Exists(id: number): Promise<boolean>
    {
        const res = await ItemRepository().count("id as c").where("id", id).first() as any;

        return res.c > 0;
    }

    public static async Update(Item: Item)
    {
        await ItemRepository().where("id", Item.id).update({
            name: Item.name,
            owner: Item.owner,
        });
    }

    public static async Create(name: string, owner: string): Promise<number>
    {
        const item = new Item();
        item.name = name;
        item.owner = owner;

        return await this.Insert(item);
    }

    public static async Insert(Item: Item): Promise<number>
    {
        const d = await ItemRepository().insert({
            id: Item.id,
            name: Item.name,
            owner: Item.owner,
        });

        Item.id = d[0];

        Logger.info("Created Item " + Item.id);

        return d[0];
    }

    public static async Delete(id: number): Promise<boolean>
    {
        const Item = await this.GetById(id);

        await ItemRepository().delete().where("id", id);

        Logger.info("Deleted Item id " + id);

        return true;
    }

    public static async All(): Promise<Item[]>
    {
        const data = await ItemRepository().select();
        const res = new Array<Item>();

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
    public owner: string = "";
}

export const ItemRepository = () => Connection("Items");