import { Server } from "..";
import { MessageWrapper } from "../MessageWrapper";

export class HelpServiceClass
{
    public checkMessage(msg: MessageWrapper)
    {
        if (msg.message.guild
            && !Server.guildIds.includes(msg.message.guild.id)
            && !Server.channelIds.includes(msg.message.channel.id)) {
            return false;
        }

        if (new RegExp("!help").test(msg.message.content)) {
            msg.reply(`
Команды RP бота Кракен:
!register (Имя персонажа) - зарегистрировать персонажа.
!login (Имя персонажа) - войти за персонажа.
!cash - баланс персонажа.
!pay (кому) (сколько) - перевести деньги другому персонажу с комиссией 5%.
!health - здоровье персонажа.
!list - все ваши персонажи.
!character (имя) - поиск персонажа и его владельца в системе
!player (@mention) - поиск персонажей игрока
!items - инвентарь персонажа
!lootbox open - открыть сундук из инвентаря
!lootbox buy - купить сундук за 100 дукатов
!help - вывод справки
            `);
            return true;
        }

        return false;
    }
}

export const HelpService = new HelpServiceClass();