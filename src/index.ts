`use strict`
function hubhub_uuidv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export interface MsgType {
    self: boolean;
    msg: string;
    sender_id: string;
}

export interface HubHubType {
    onMessageCB(msg: MsgType): void;
    subscribe(x: string, cb: (msg: MsgType) => void): void,
    sendMessage(x: string): void;
    room?: string;
    pubsubService?: string;
    sender_id?: string;
    ready: Promise<boolean>;
}

export class HubHub implements HubHubType {
    sender_id?= ''
    pubsubService?= '';
    onMessageCB = (msg: MsgType) => { };
    room?= '';
    ready: Promise<boolean>;
    resolveReady?: () => void;

    constructor(pubsubService: string) {
        this.pubsubService = pubsubService;
        this.sender_id = localStorage.getItem('hubhub_sender_id') || hubhub_uuidv4();
        localStorage.setItem('hubhub_sender_id', this.sender_id);
        this.ready = new Promise(resolve => this.resolveReady = resolve);
    }


     subscribe(room: string, cb: (msg: MsgType) => void) {
        if (this.room) {
            console.log("hubhub: already subscribed to a room:", this.room);
            return;
        }

        if (document.getElementById('hubhub-frame-wrap')) {
            console.warn('hubhub: not embedding twice');
            return;
        }

        this.onMessageCB = cb;

        console.log('... embedding wix iframe...', this.pubsubService, this.room);

        this.room = room;
        const framewrap = document.createElement('div');
        framewrap.hidden = true;
        framewrap.id = 'hubhub-frame-wrap';
        framewrap.innerHTML = `<iframe src="${this.pubsubService}?room=${room}" title="hubhub id="hubhub-frame"></iframe>`;
        document.body.appendChild(framewrap);

        console.log('embedded wix iframe...', this.pubsubService);

        window.addEventListener("message", message => {
            if (message.data.pubsubready) {
                console.log('got ready message');
                this.resolveReady && this.resolveReady();
            }

            if (message.data.pubsub) {
                const msg = JSON.parse(message.data.pubsub.payload);
                msg.self = false;
                if (msg.sender_id === this.sender_id) { // filter myself
                    msg.self = true;
                }
                console.log("HUBHUB: got message", message.data.pubsub);
                this.onMessageCB && this.onMessageCB(msg);

            }
        });
    }

    async sendMessage(msg: string) {
        console.log('want to send message, waiting for ready...');
        await this.ready;
        console.log('ready! sending', msg);
        if (!msg) {
            return;
        }
        const msgstring = JSON.stringify({ sender_id: this.sender_id, msg })
        fetch(
            `${this.pubsubService}/_functions/pubsub?room=${this.room}&message=${msgstring}`
        );
    }
}


