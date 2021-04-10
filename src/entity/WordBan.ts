import { Connection } from "../DataBase";
import { Logger } from "../utility/Logger";

export class WordBan
{
    public static async From(dbobject: any): Promise<WordBan>
    {
        const res = new WordBan();
        res.Id = dbobject.Id;
        res.Match = dbobject.Match;
        res.Occured = dbobject.Occured;

        return res;
    }

    public static async GetById(id: number): Promise<WordBan>
    {
        const data = await BansRepository().select().where("Id", id).first();

        if (data) {
            return this.From(data);
        }

        return null;
    }

    public static async GetWithMatch(match: string): Promise<WordBan>
    {
        const data = await BansRepository().select().where("Match", match).first();

        if (data) {
            return this.From(data);
        }

        return null;
    }

    public static async Create(match: string): Promise<number>
    {
        const wordban = new WordBan();
        wordban.Match = match;

        return this.Insert(wordban);
    }

    public static async Insert(WordBan: WordBan): Promise<number>
    {
        const d = await BansRepository().insert({
            Id: WordBan.Id,
            Match: WordBan.Match,
            Occured: WordBan.Occured,
        });

        WordBan.Id = d[0];

        Logger.info("Created WordBan " + WordBan.Id);

        return d[0];
    }

    public static async Update(ban: WordBan)
    {
        await BansRepository().where("Id", ban.Id).update({
            Match: ban.Match,
            Occured: ban.Occured,
        });
    }

    public static async Delete(id: number): Promise<boolean>
    {
        await BansRepository().delete().where("Id", id);

        Logger.info("Deleted WordBan Id " + id);

        return true;
    }

    public static async MatchAll(value: string): Promise<WordBan[]>
    {
        const data = await BansRepository().select()
        .whereRaw(`"??" like ??`, [value.replace(new RegExp("[\"'`]"), ""), "Match"]).orderBy("Occured", "desc");
        const res = new Array<WordBan>();

        if (data) {
            for (const entry of data) {
                res.push(await this.From(entry));
            }

            return res;
        }

        return [];
    }

    public static async All(): Promise<WordBan[]>
    {
        const data = await BansRepository().select().orderBy("Occured", "desc");
        const res = new Array<WordBan>();

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

export const BansRepository = () => Connection("WordBans");
