import { Connection } from "../DataBase";
import { Logger } from "../utility/Logger";
import * as knex from "knex";

export class WordException
{
    public static async From(dbobject: any): Promise<WordException>
    {
        const res = new WordException();
        res.Id = dbobject.Id;
        res.Match = dbobject.Match;
        res.Occured = dbobject.Occured;

        return res;
    }

    public static async GetById(id: number): Promise<WordException>
    {
        const data = await ExceptionsRepository().select().where("Id", id).first();

        if (data) {
            return this.From(data);
        }

        return null;
    }

    public static async GetWithMatch(match: string): Promise<WordException>
    {
        const data = await ExceptionsRepository().select().where("Match", match).first();

        if (data) {
            return this.From(data);
        }

        return null;
    }

    public static async Create(match: string): Promise<number>
    {
        const exception = new WordException();
        exception.Match = match;

        return this.Insert(exception);
    }

    public static async Insert(exception: WordException): Promise<number>
    {
        const d = await ExceptionsRepository().insert({
            Id: exception.Id,
            Match: exception.Match,
            Occured: exception.Occured,
        });

        exception.Id = d[0];

        Logger.info("Created WordException " + exception.Id);

        return d[0];
    }

    public static async Update(ban: WordException)
    {
        await ExceptionsRepository().where("Id", ban.Id).update({
            Match: ban.Match,
            Occured: ban.Occured,
        });
    }

    public static async Delete(id: number): Promise<boolean>
    {
        await ExceptionsRepository().delete().where("Id", id);

        Logger.info("Deleted WordException Id " + id);

        return true;
    }

    public static async MatchAll(value: string): Promise<WordException[]>
    {
        const data = await ExceptionsRepository().select()
        .whereRaw(`"??" like ??`, [value.replace(new RegExp("[\"'`]"), ""), "Match"]).orderBy("Occured", "desc");
        const res = new Array<WordException>();

        if (data) {
            for (const entry of data) {
                res.push(await this.From(entry));
            }

            return res;
        }

        return [];
    }

    public static async All(): Promise<WordException[]>
    {
        const data = await ExceptionsRepository().select().orderBy("Occured", "desc");
        const res = new Array<WordException>();

        if (data) {
            for (const entry of data) {
                res.push(await this.From(entry));
            }

            return res;
        }

        return [];
    }

    public Id: number;
    public Match: string;
    public Occured: number = 0;
}

export const ExceptionsRepository = () => Connection("WordExceptions");
