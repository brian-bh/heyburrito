import config from './config';
import BurritoStore from './store/BurritoStore';
import LocalStore from './store/LocalStore';
import { parseMessage } from './lib/parseMessage';
import { validBotMention, validMessage } from './lib/validator';
import Socket from './slack/Socket';
import Wbc from './slack/Wbc';

const {
    enableDecrement,
    dailyCap,
    dailyDecCap,
    emojiInc,
    emojiDec,
    disableEmojiDec,
} = config.slack;

interface Emojis {
    type: string;
    emoji: string;
}

interface Updates {
    username: string;
    type: string;
}
const emojis: Array<Emojis> = [];

const incEmojis = emojiInc.split(',').map((emoji => emoji.trim()));
incEmojis.forEach((emoji: string) => emojis.push({ type: 'inc', emoji }));

if (!disableEmojiDec) {
    const decEmojis = emojiDec.split(',').map((emoji => emoji.trim()));
    decEmojis.forEach((emoji: string) => emojis.push({ type: 'dec', emoji }));
}

const giveBurritos = async (giver: string, updates: Updates[]) => {
    return updates.reduce(async (prev: any, burrito) => {
        return prev.then(async () => {
            if (burrito.type === 'inc') {
                await BurritoStore.giveBurrito(burrito.username, giver);
            } else if (burrito.type === 'dec') {
                await BurritoStore.takeAwayBurrito(burrito.username, giver);
            }
        });
    }, Promise.resolve());
};

const notifyUser = (user: string, message: string) => Wbc.sendDM(user, message);

const handleBurritos = async (giver: string, updates: Updates[]) => {
    if (enableDecrement) {
        const burritos = await BurritoStore.givenBurritosToday(giver, 'from');
        const diff = dailyCap - burritos;
        if (updates.length > diff) {
            notifyUser(giver, `${updates.length}개의 칭찬을 주려고 하셨지만, ${diff}개의 칭찬 밖에 남지 않았네요..!`);
            return false;
        }
        if (burritos >= dailyCap) {
            return false;
        }
        await giveBurritos(giver, updates);
    } else {
        const givenBurritos = await BurritoStore.givenToday(giver, 'from', 'inc');
        const givenRottenBurritos = await BurritoStore.givenToday(giver, 'from', 'dec');
        const incUpdates = updates.filter((x) => x.type === 'inc');
        const decUpdates = updates.filter((x) => x.type === 'dec');
        const diffInc = dailyCap - givenBurritos;
        const diffDec = dailyDecCap - givenRottenBurritos;
        if (incUpdates.length) {
            if (incUpdates.length > diffInc) {
                notifyUser(giver, `${updates.length} 개의 칭찬을 주려고 하셨지만, ${diffInc} 개의 칭찬 밖에 남지 않았네요..!`);
            } else {
                await giveBurritos(giver, incUpdates);
            }
        }
        if (decUpdates.length) {
            if (decUpdates.length > diffDec) {
                notifyUser(giver, `You are trying to give away ${updates.length} rottenburritos, but you only have ${diffDec} rottenburritos left today!`);
            } else {
                await giveBurritos(giver, decUpdates);
            }
        }
    }
    return true;
};

const start = () => {
    Socket.on('slackMessage', async (event: any) => {
        if (validMessage(event, emojis, LocalStore.getAllBots())) {
            if (validBotMention(event, LocalStore.botUserID())) {
                // Geather data and send back to user
            } else {
                const result = parseMessage(event, emojis);
                if (result) {
                    const { giver, updates } = result;
                    if (updates.length) {
                        await handleBurritos(giver, updates);
                    }
                }
            }
        }
    });
};

export {
    handleBurritos,
    notifyUser,
    start,
};
