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
    sender_id?: string;
    msg_id: string;
    msg_time: number;
    status?: string;
}

export interface HubHubType {
    onMessageCB(msg: MsgType): void;
    subscribe(x: string, cb: (msg: MsgType) => void): void,
    sendMessage(x: string): MsgType | undefined;
    room?: string;
    sender_id?: string;
    ready: Promise<boolean>;
    init(x: string): void;
}

class HubHub implements HubHubType {
    sender_id?= ''
    public pubsubService?= '';
    onMessageCB = (msg: MsgType) => { };
    room?= '';
    ready: Promise<boolean>;
    resolveReady?: () => void;

    constructor() {
        this.sender_id = localStorage.getItem('hubhub_sender_id') || hubhub_uuidv4();
        localStorage.setItem('hubhub_sender_id', this.sender_id);
        this.ready = new Promise(resolve => this.resolveReady = resolve);
    }

    init(pubsubService: string) {
        this.pubsubService = pubsubService;
    }


    subscribe(room: string, cb: (msg: MsgType) => void) {
        if (this.room) {
            console.log("hubhub: already subscribed to a room:", this.room);
            return;
        }

        this.onMessageCB = cb;

        if (document.getElementById('hubhub-frame-wrap')) {
            // already embedded so make sure ready
            this.resolveReady && this.resolveReady();
            console.warn('hubhub: not embedding twice');
        }
        else {

            console.log('... embedding wix iframe...', this.pubsubService, this.room);

            this.room = room;
            const framewrap = document.createElement('div');
            framewrap.hidden = true;
            framewrap.id = 'hubhub-frame-wrap';
            framewrap.innerHTML = `<iframe src="${this.pubsubService}?room=${room}" title="hubhub id="hubhub-frame"></iframe>`;
            document.body.appendChild(framewrap);

            console.log('hubhub: embedded wix iframe...', this.pubsubService);
        }

        // prevent doubles
        console.log('hubhub: will listen to messages');
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
                else {
                    msg.self = false;
                }
                console.log("hubhub: got message", message.data.pubsub);
                this.onMessageCB && this.onMessageCB(msg);

            }
        });
    }

    sendMessage(msg: string) {
        console.log('hubhub: sending', msg);
        if (!msg) {
            return;
        }
        const msgobj: MsgType = { sender_id: this.sender_id, msg, msg_id: hubhub_uuidv4(), msg_time: (new Date()).getTime(), status: 'sending', self: true };
        const msgstring = JSON.stringify(msgobj);
        fetch(
            `${this.pubsubService}/_functions/pubsub?room=${this.room}&message=${msgstring}`
        );
        return msgobj;
    }
}

const hubhub = new HubHub();
export default hubhub;


