import * as log from 'bog';
import { WebClient } from '@slack/web-api';
import { SocketModeClient } from '@slack/socket-mode';
import { SocketMock, WebMock } from '../../test/lib/slackMock';
import config from '../config';

const { slackMock } = config.misc;

log.debug('Slack mockApi loaded', slackMock);
const appToken = config.slack.app_token;
const botToken = config.slack.bot_token;

export default {
    socket: slackMock ? new SocketMock() : new SocketModeClient({ appToken }),
    wbc: slackMock ? new WebMock() : new WebClient(botToken)
};
