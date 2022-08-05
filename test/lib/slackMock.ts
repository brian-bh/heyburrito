import { wbcList } from '../data/slackUsers'
import { EventEmitter } from 'events';

class SocketMock extends EventEmitter {

    start() {
        return Promise.resolve(true);
    }

    // Function to test emits
    async publish(message: any) {
        this.emit('message', message);
    }
}

class WebMock {
    users = {
        list: function() {
            return Promise.resolve(wbcList)
        }
    }
}

export {
    SocketMock,
    WebMock
}
