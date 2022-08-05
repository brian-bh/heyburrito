import * as log from 'bog';
import { EventEmitter } from 'events';

interface SlackEvent {
    type: string;
    text: string;
    user: string;
    client_msg_id?: string;
    suppress_notification?: boolean;
    team?: string;
    channel?: string,
    event_ts?: string;
    ts?: string;
    subtype?: string;
}

class Socket extends EventEmitter {
    socket: any;

    register(socket: any) {
        this.socket = socket;
        this.listener();
    }

    listener(): void {
        log.info('Listening on slack messages');
        this.socket.on('message', (event: SlackEvent) => {
            if ((!!event.subtype) && (event.subtype === 'channel_join')) {
                log.info('Joined channel', event.channel);
            }
            if (event.type === 'message') {
                this.emit('slackMessage', event);
            }
        });
    }
}

export default new Socket();
