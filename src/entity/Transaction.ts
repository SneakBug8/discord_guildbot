import { DiscordBot } from "../api/discord";
import { Connection } from "../DataBase";
import { CashMovement, Logger } from "../utility/Logger";
import { sleep } from "../utility/sleep";

export class Transaction
{
    public static async From(dbobject: any): Promise<Transaction>
    {
        const res = new Transaction();
        res.Id = dbobject.Id;
        res.Name = dbobject.Name;
        res.Cash = dbobject.Cash;
        res.Timestamp = new Date(dbobject.Timestamp);
        res.Reason = dbobject.Reason;

        return res;
    }

    public static async GetById(id: number): Promise<Transaction>
    {
        const data = await TransactionRepository().select().where("Id", id).first();

        if (data) {
            return this.From(data);
        }

        return null;
    }

    public static async GetWithName(id: string): Promise<Transaction>
    {
        const data = await TransactionRepository().select().where("Name", id).first();

        if (data) {
            return this.From(data);
        }

        return null;
    }

    public static async Exists(id: number): Promise<boolean>
    {
        const res = await TransactionRepository().count("Id as c").where("Id", id).first() as any;

        return res.c > 0;
    }

    public static async Update(transaction: Transaction)
    {
        await TransactionRepository().where("Id", transaction.Id).update({
            Name: transaction.Name,
            Cash: transaction.Cash,
            Timestamp: transaction.Timestamp.toISOString(),
            Reason: transaction.Reason,
        });
    }

    public static async Create(name: string, cash: number, reason: string = null): Promise<number>
    {
        const transaction = new Transaction();
        transaction.Name = name;
        transaction.Cash = cash;
        transaction.Reason = reason;

        CashMovement.info(`${name} | ${reason}, change: ${cash}`);

        return this.Insert(transaction);
    }

    public static async Insert(transaction: Transaction): Promise<number>
    {
        const d = await TransactionRepository().insert({
            Id: transaction.Id,
            Name: transaction.Name,
            Cash: transaction.Cash,
            Timestamp: transaction.Timestamp.toISOString(),
            Reason: transaction.Reason,
        });

        transaction.Id = d[0];

        Logger.info("Created Transaction " + transaction.Id);

        return d[0];
    }

    public static async Delete(id: number): Promise<boolean>
    {
        const Transaction = await this.GetById(id);

        await TransactionRepository().delete().where("id", id);

        Logger.info("Deleted Transaction id " + id);

        return true;
    }

    public static async All(): Promise<Transaction[]>
    {
        const data = await TransactionRepository().select();
        const res = new Array<Transaction>();

        if (data) {
            for (const entry of data) {
                res.push(await this.From(entry));
            }

            return res;
        }

        return [];
    }

    public static async Last100(): Promise<Transaction[]>
    {
        const data = await TransactionRepository().select().orderBy("id", "desc").limit(100);
        const res = new Array<Transaction>();

        if (data) {
            for (const entry of data) {
                res.push(await this.From(entry));
            }

            return res;
        }

        return [];
    }

    public Id: number;
    public Name: string = "";
    public Cash: number = 0;
    public Timestamp: Date = new Date(Date.now());
    public Reason: string = null;
}

export const TransactionRepository = () => Connection("Transactions");
