import { Server } from "..";
import { Character } from "../entity/Character";
import { CharacterService } from "./CharacterService";
import { Requisite } from "./Requisites/Requisite";

class TaskServiceClass
{
    private EndText = `После выполнения задания для получения награды обратитесь в канал `
        + `#отчёты-и-таймскипы с скриншотом выполнения.`;

    private CashForTask = 10;

    public Init()
    {
        Server.RegisterCommand("^!task give ([a-zA-Zа-яА-Я ]+?) *; *(.+)$", async (msg, matches) =>
        {
            if (msg.message.author.id !== Server.adminId) {
                msg.reply("Вы не администратор для выполнения этого действия.");
                return;
            }

            const res = await this.GiveTask(matches[1], matches[2]);

            msg.reply(res.message);
            return true;
        });

        Server.RegisterCommand("^!task end ([a-zA-Zа-яА-Я ]+?) *; *(.+)$", async (msg, matches) =>
        {
            if (msg.message.author.id !== Server.adminId) {
                msg.reply("Вы не администратор для выполнения этого действия.");
                return;
            }

            const res = await this.EndTask(matches[1], matches[2]);

            msg.reply(res.message);
            return true;
        });

        Server.RegisterCommand("^!task fail ([a-zA-Zа-яА-Я ]+?) *; *(.+)$", async (msg, matches) =>
        {
            if (msg.message.author.id !== Server.adminId) {
                msg.reply("Вы не администратор для выполнения этого действия.");
                return;
            }

            const res = await this.FailTask(matches[1], matches[2]);

            msg.reply(res.message);
            return true;
        });

        Server.RegisterCommand("^!task give ([a-zA-Zа-яА-Я ,]+?) *; *(.+)$", async (msg, matches) =>
        {
            if (msg.message.author.id !== Server.adminId) {
                msg.reply("Вы не администратор для выполнения этого действия.");
                return;
            }

            const t1 = matches[1].replace(/, /, ",");
            const names = t1.split(",");

            const res = await this.GiveTaskToMany(names, matches[2]);

            msg.reply(res.message);
            return true;
        });

        Server.RegisterCommand("^!task end ([a-zA-Zа-яА-Я ,]+?) *; *(.+)$", async (msg, matches) =>
        {
            if (msg.message.author.id !== Server.adminId) {
                msg.reply("Вы не администратор для выполнения этого действия.");
                return;
            }

            const t1 = matches[1].replace(/, /, ",");
            const names = t1.split(",");

            const res = await this.EndTaskToMany(names, matches[2]);

            msg.reply(res.message);
            return true;
        });

        Server.RegisterCommand("^!task fail ([a-zA-Zа-яА-Я ,]+?) *; *(.+)$", async (msg, matches) =>
        {
            if (msg.message.author.id !== Server.adminId) {
                msg.reply("Вы не администратор для выполнения этого действия.");
                return;
            }

            const t1 = matches[1].replace(/, /, ",");
            const names = t1.split(",");

            const res = await this.FailTaskToMany(names, matches[2]);

            msg.reply(res.message);
            return true;
        });
    }

    public async GiveTask(name: string, text: string)
    {
        const char = await CharacterService.TryGetCharacterByName(name);

        if (!char.result) {
            return char;
        }

        await Character.SendMessage(char.data, `:exclamation: Персонаж ${name} получил задание "${text}". ` + this.EndText);
        Server.SendMessages(Server.taskIds, `:exclamation: Персонаж **${name}** получил задание "${text}".`);

        return new Requisite(`:exclamation: Успешно выдано задание "${text}" персонажу ${name}`);
    }

    public async EndTask(name: string, text: string)
    {
        const char = await CharacterService.TryGetCharacterByName(name);

        if (!char.result) {
            return char;
        }

        await CharacterService.CreateCash(name, this.CashForTask, "Task completed");

        await Character.SendMessage(char.data, `:white_check_mark: Персонаж ${name} успешно выполнил задание "${text}". ` + this.EndText);
        Server.SendMessages(Server.taskIds, `:white_check_mark: Персонаж **${name}** выполнил задание "${text}".`);

        return new Requisite(`:white_check_mark: Успешно завершено задание "${text}" персонажа ${name}`);
    }

    public async FailTask(name: string, text: string)
    {
        const char = await CharacterService.TryGetCharacterByName(name);

        if (!char.result) {
            return char;
        }

        await Character.SendMessage(char.data, `:x: Персонаж ${name} провалил задание "${text}". ` + this.EndText);
        Server.SendMessages(Server.taskIds, `:x: Персонаж **${name}** провалил задание "${text}".`);

        return new Requisite(`:x: Провалено задание "${text}" персонажем ${name}`);
    }

    public async GiveTaskToMany(names: string[], text: string)
    {
        const chars = names.join();

        for (const name of names) {

            const char = await CharacterService.TryGetCharacterByName(name);

            if (!char.result) {
                continue;
            }


            await Character.SendMessage(char.data, `:exclamation: Персонаж ${name} в составе группы ${chars} `
                + `получил задание "${text}". ` + this.EndText);
        }

        Server.SendMessages(Server.taskIds, `:exclamation: Персонажи **${chars}** получили задание "${text}".`);

        return new Requisite(`:exclamation: Успешно выдано задание "${text}" персонажам ${chars}`);
    }

    public async EndTaskToMany(names: string[], text: string)
    {
        const chars = names.join();

        for (const name of names) {

            const char = await CharacterService.TryGetCharacterByName(name);

            if (!char.result) {
                continue;
            }

            await CharacterService.CreateCash(name, this.CashForTask, "Task completed");

            await Character.SendMessage(char.data, `:white_check_mark: Персонаж ${name} в составе группы ${chars} `
                + `выполнил задание "${text}". ` + this.EndText);
        }

        Server.SendMessages(Server.taskIds, `:white_check_mark: Персонажи **${chars}** успешно выполнили задание "${text}".`);

        return new Requisite(`:white_check_mark: Успешно завершено задание "${text}" персонажами ${chars}`);
    }

    public async FailTaskToMany(names: string[], text: string)
    {
        const chars = names.join();

        for (const name of names) {

            const char = await CharacterService.TryGetCharacterByName(name);

            if (!char.result) {
                continue;
            }

            await Character.SendMessage(char.data, `:x: Персонаж ${name} в составе группы ${chars} `
                + `провалил задание "${text}". ` + this.EndText);
        }

        Server.SendMessages(Server.taskIds, `:x: Персонажи **${chars}** провалили задание "${text}".`);

        return new Requisite(`:x: Провалено задание "${text}" персонажами ${chars}`);
    }
}

export const TaskService = new TaskServiceClass();
