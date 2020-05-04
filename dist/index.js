var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
`use strict`;
function hubhub_uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
export class HubHub {
    constructor(pubsubService) {
        this.sender_id = '';
        this.pubsubService = '';
        this.onMessageCB = (msg) => { };
        this.room = '';
        this.pubsubService = pubsubService;
        this.sender_id = localStorage.getItem('hubhub_sender_id') || hubhub_uuidv4();
        localStorage.setItem('hubhub_sender_id', this.sender_id);
        this.ready = new Promise(resolve => this.resolveReady = resolve);
    }
    subscribe(room, cb) {
        if (this.room) {
            console.log("already subscribed to a room:", this.room);
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
                if (msg.sender_id === this.sender_id) { // filter myself
                    msg.self = true;
                }
                console.log("HUBHUB: got message", message.data.pubsub);
                this.onMessageCB && this.onMessageCB(msg);
            }
        });
    }
    sendMessage(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('want to send message, waiting for ready...');
            yield this.ready;
            console.log('ready! sending', msg);
            if (!msg) {
                return;
            }
            const msgstring = JSON.stringify({ sender_id: this.sender_id, msg });
            fetch(`${this.pubsubService}/_functions/pubsub?room=${this.room}&message=${msgstring}`);
        });
    }
}
//# sourceMappingURL=index.js.map