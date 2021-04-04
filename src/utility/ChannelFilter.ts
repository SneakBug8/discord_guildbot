import { Server } from "..";
import { MessageWrapper } from "../MessageWrapper";

export function ChannelFilter(decorated)
{
    return (msg: MessageWrapper, matches) =>
    {
        const member = msg.message.member;

        if (msg.message.channel.type !== "dm" && !Server.channelIds.includes(msg.message.channel.id) &&
            msg.message.author.id !== Server.adminId) {
            return false;
        }

        return decorated(msg, matches);
    };
}