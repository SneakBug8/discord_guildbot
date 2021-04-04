import { DiscordBot } from "../api/discord";
import { Connection } from "../DataBase";
import { Logger } from "../utility/Logger";

export class Relations
{
    public static async From(dbobject: any): Promise<Relations>
    {
        const res = new Relations();
        res.id = dbobject.id;
        res.name = dbobject.name;
        res.value = dbobject.cash;

        return res;
    }

    public static async GetById(id: number): Promise<Relations>
    {
        const data = await RelationsRepository().select().where("id", id).first();

        if (data) {
            return this.From(data);
        }

        return null;
    }

    public static async GetWithName(id: string): Promise<Relations>
    {
        const data = await RelationsRepository().select().where("name", id).first();

        if (data) {
            return this.From(data);
        }

        return null;
    }

    public static async GetWithUserID(id: string): Promise<Relations[]>
    {
        const data = await RelationsRepository().select().where("userId", id);

        const res = new Array<Relations>();

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
        const res = await RelationsRepository().count("id as c").where("id", id).first() as any;

        return res.c > 0;
    }

    public static async Update(relations: Relations)
    {
        await RelationsRepository().where("id", relations.id).update({
            name: relations.name,
            value: relations.value,
        });
    }

    public static async Create(name: string, value: number): Promise<number>
    {
        const relations = new Relations();
        relations.name = name;
        relations.value = value;

        return this.Insert(relations);
    }

    public static async Insert(Relations: Relations): Promise<number>
    {
        const d = await RelationsRepository().insert({
            id: Relations.id,
            value: Relations.value,
            name: Relations.name,
        });

        Relations.id = d[0];

        Logger.info("Created Relations " + Relations.id);

        return d[0];
    }

    public static async Delete(id: number): Promise<boolean>
    {
        const Relations = await this.GetById(id);

        await RelationsRepository().delete().where("id", id);

        Logger.info("Deleted Relations id " + id);

        return true;
    }

    public static async All(): Promise<Relations[]>
    {
        const data = await RelationsRepository().select();
        const res = new Array<Relations>();

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
    public value: number = 0;
}

export const RelationsRepository = () => Connection("Relations");