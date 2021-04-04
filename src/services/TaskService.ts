import { Server } from "..";
import { Character } from "../entity/Character";
import { CharacterService } from "./CharacterService";
import { Requisite } from "./Requisites/Requisite";

class TaskServiceClass
{
    private EndText = `После выполнения задания для получения награды обратитесь `
        + `к <@!156979394953478144> с отчётом о выполнении.`;

    public Init()
    {
        Server.RegisterCommand("^!task give ([a-zA-Zа-яА-Я ]+?) *; *(.+)$", async (msg, matches) =>
        {
            if (msg.message.author.id !== Server.adminId) {
                msg.reply("Вы не администратор для выполнения этого действия.");
                return;
            }

            console.log(matches);

            const res = await this.GiveTask(matches[1], matches[2]);

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
    }

    public async GiveTask(name: string, text: string)
    {
        const char = await CharacterService.TryGetCharacterByName(name);

        if (!char.result) {
            return char;
        }

        await Character.SendMessage(char.data, `Персонаж ${name} получил задание "${text}". ` + this.EndText);
        Server.SendMessages(Server.generalIds, `Персонаж ${name} получил задание "${text}".`);

        return new Requisite(`Успешно выдано задание "${text}" персонажу ${name}`);
    }

    public async GiveTaskToMany(names: string[], text: string)
    {
        const chars = names.join(", ");

        for (const name of names) {

            const char = await CharacterService.TryGetCharacterByName(name);

            if (!char.result) {
                continue;
            }

            await Character.SendMessage(char.data, `Персонаж ${name} в составе группы ${chars} `
                + `получил задание "${text}". ` + this.EndText);
        }

        Server.SendMessages(Server.generalIds, `Персонажи ${chars} получили задание "${text}".`);

        return new Requisite(`Успешно выдано задание "${text}" персонажам ${chars}`);
    }
}

export const TaskService = new TaskServiceClass();
