import { DiscordBot } from "../api/discord";
import { Connection } from "../DataBase";
import { Logger } from "../utility/Logger";
import { sleep } from "../utility/sleep";

export class Character
{
    public static async From(dbobject: any): Promise<Character>
    {
        const res = new Character();
        res.id = dbobject.id;
        res.name = dbobject.name;
        res.cash = dbobject.cash;
        res.userId = dbobject.userId;
        res.dead = dbobject.dead;
        res.injury = dbobject.injury;

        return res;
    }

    public static async GetById(id: number): Promise<Character>
    {
        const data = await CharacterRepository().select().where("id", id).first();

        if (data) {
            return this.From(data);
        }

        return null;
    }

    public static async GetWithName(id: string): Promise<Character>
    {
        const data = await CharacterRepository().select().where("name", id).first();

        if (data) {
            return this.From(data);
        }

        return null;
    }

    public static async GetWithUserID(id: string): Promise<Character[]>
    {
        const data = await CharacterRepository().select().where("userId", id);

        const res = new Array<Character>();

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
        const res = await CharacterRepository().count("id as c").where("id", id).first() as any;

        return res.c > 0;
    }

    public static async Update(character: Character)
    {
        await CharacterRepository().where("id", character.id).update({
            name: character.name,
            cash: (character.cash > 100) ? 100 : character.cash,
            userId: character.userId,
            dead: character.dead,
            injury: (character.injury < 0) ? 0 : character.injury,
        });
    }

    public static async Create(name: string, userId: string): Promise<number>
    {
        const character = new Character();
        character.name = name;
        character.userId = userId;

        return this.Insert(character);
    }

    public static async Insert(character: Character): Promise<number>
    {
        const d = await CharacterRepository().insert({
            id: character.id,
            cash: (character.cash > 100) ? 100 : character.cash,
            name: character.name,
            userId: character.userId,
            dead: character.dead,
            injury: (character.injury < 0) ? 0 : character.injury
        });

        character.id = d[0];

        Logger.info("Created character " + character.id);

        return d[0];
    }

    public static async Delete(id: number): Promise<boolean>
    {
        const character = await this.GetById(id);

        await CharacterRepository().delete().where("id", id);

        Logger.info("Deleted character id " + id);

        return true;
    }

    public static async Richest(): Promise<Character[]>
    {
        const data = await CharacterRepository().select().orderBy("cash", "desc")
            .whereNot("userId", "156979394953478144").limit(10);
        const res = new Array<Character>();

        if (data) {
            for (const entry of data) {
                res.push(await this.From(entry));
            }

            return res;
        }

        return [];
    }

    public static async TotalCash(): Promise<number>
    {
        const data = await CharacterRepository().sum("cash as c").select();

        if (data) {
                return data[0].c;
            }

        return 0;
    }

    public static async All(): Promise<Character[]>
    {
        const data = await CharacterRepository().select();
        const res = new Array<Character>();

        if (data) {
            for (const entry of data) {
                res.push(await this.From(entry));
            }

            return res;
        }

        return [];
    }

    public static async SendMessage(char: Character, msg: string)
    {
        await sleep(500);
        if (msg) {
            const receiver = await DiscordBot.users.fetch(char.userId);
            receiver.send(msg);
        }
    }

    public id: number;
    public name: string = "";
    public cash: number = 0;
    public userId: string;
    public dead: boolean = false;
    public injury: number = 0;
}

export const CharacterRepository = () => Connection("Characters");
