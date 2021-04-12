import { Server } from "..";
import { MessageWrapper } from "../MessageWrapper";

export class HelpServiceClass
{
    public HelpText = `
    Команды RP бота Кракен:
    !register (Имя персонажа) - зарегистрировать персонажа.
    !login (Имя персонажа) - войти за персонажа.
    !status - Состояние персонажа.
    !daily - Получить ежедневную награду.
    !cash - Посмотреть баланс персонажа.
    !health - Проверить здоровье персонажа.
    !pay (кому) (сколько) - Перевести благосклонность другому персонажу с потерей 50%.
    !characters - Посмотреть всех ваших персонажей.
    !character (имя) - Поиск персонажа и его владельца в системе.
    !player (@mention) - Поиск персонажей игрока.
    !items - Инвентарь персонажа.
    !lootbox open - Открыть сундук из инвентаря.
    !lootbox buy - Еупить сундук за 10 благосклонности.
    !help - Вывод справки.
`;
    public checkMessage(msg: MessageWrapper)
    {
        if (msg.message.guild
            && !Server.guildIds.includes(msg.message.guild.id)
            && !Server.channelIds.includes(msg.message.channel.id)) {
            return false;
        }

        if (new RegExp("!help").test(msg.message.content)) {
            msg.reply(this.HelpText);
            return true;
        }

        return false;
    }
}

export const HelpService = new HelpServiceClass();
