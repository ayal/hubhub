`use strict`;
function hubhub_uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
class HubHub {
    constructor() {
        this.sender_id = '';
        this.pubsubService = '';
        this.onMessageCB = (msg) => { };
        this.room = '';
        this.sender_id = localStorage.getItem('hubhub_sender_id') || hubhub_uuidv4();
        localStorage.setItem('hubhub_sender_id', this.sender_id);
        this.ready = new Promise(resolve => this.resolveReady = resolve);
    }
    init(pubsubService) {
        this.pubsubService = pubsubService;
    }
    subscribe(room, cb) {
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
                console.log("hubhub: got message", message.data.pubsub);
                this.onMessageCB && this.onMessageCB(msg);
            }
        });
    }
    sendMessage(msg) {
        console.log('hubhub: sending', msg);
        if (!msg) {
            return;
        }
        const msgobj = { sender_id: this.sender_id, msg, msg_id: hubhub_uuidv4(), msg_time: (new Date()).getTime(), status: 'sending' };
        const msgstring = JSON.stringify(msgobj);
        fetch(`${this.pubsubService}/_functions/pubsub?room=${this.room}&message=${msgstring}`);
        return msgobj;
    }
}
const hubhub = new HubHub();
export default hubhub;
//# sourceMappingURL=index.js.map