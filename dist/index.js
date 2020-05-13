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
class HubHub {
    constructor() {
        this.onMessageCB = {};
        this.sender_id = '';
        this.pubsubService = '';
        this.sender_id = localStorage.getItem('hubhub_sender_id') || hubhub_uuidv4();
        localStorage.setItem('hubhub_sender_id', this.sender_id);
        this.ready = new Promise(resolve => this.resolveReady = resolve);
    }
    handler(message) {
        if (message.data.pubsubready) {
            console.log('hubhub: got ready message');
            this.resolveReady && this.resolveReady();
        }
        if (message.data.pubsub) {
            const doc = message.data.pubsub.payload;
            doc.data = JSON.parse(doc.data);
            console.log("hubhub: got message", message.data.pubsub);
            this.onMessageCB && this.onMessageCB[message.data.pubsub.payload.collection]([doc]);
        }
    }
    init(pubsubService) {
        console.log('hubhub: initting', pubsubService);
        this.pubsubService = pubsubService;
        if (document.getElementById('hubhub-frame-wrap')) {
            // already embedded so make sure ready
            this.resolveReady && this.resolveReady();
            console.warn('hubhub: not embedding twice');
            return;
        }
        else {
            console.log('... embedding wix iframe...', this.pubsubService);
            const framewrap = document.createElement('div');
            framewrap.hidden = true;
            framewrap.id = 'hubhub-frame-wrap';
            framewrap.innerHTML = `<iframe src="${this.pubsubService}" title="hubhub id="hubhub-frame"></iframe>`;
            document.body.appendChild(framewrap);
            console.log('hubhub: embedded wix iframe...', this.pubsubService);
        }
        // prevent doubles
        console.log('hubhub: will listen to messages');
        window.addEventListener("message", this.handler);
    }
    kill() {
        console.log('hubhub: killing...');
        window.removeEventListener('message', this.handler);
    }
    get(collection, skip = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('hubhub: getting', collection, skip);
            const res = yield fetch(`${this.pubsubService}/_functions/pubsubget?collection=${collection}&skip=${skip}`);
            console.log('hubhub: get response', res);
            const docs = yield res.json();
            return docs.map((doc) => {
                doc.data = JSON.parse(doc.data);
                return doc;
            });
        });
    }
    on(collection, cb) {
        this.onMessageCB[collection] = cb;
        fetch(`${this.pubsubService}/_functions/pubsubsub?collection=${collection}`);
    }
    set(collection, data, persist = true) {
        console.log('hubhub: sending', data);
        if (!data) {
            return;
        }
        const docobj = { sender_id: this.sender_id, data: JSON.stringify(data), doc_id: hubhub_uuidv4(), time: (new Date()).getTime() };
        const docstring = JSON.stringify(docobj);
        fetch(`${this.pubsubService}/_functions/pubsub?collection=${collection}&message=${docstring}&persist=${persist}`);
        return docobj;
    }
    update(doc_id, data) {
        fetch(`${this.pubsubService}/_functions/pubsubupdate?doc_id=${doc_id}&sender_id=${this.sender_id}&data=${data}`);
    }
}
const hubhub = new HubHub();
export default hubhub;
//# sourceMappingURL=index.js.map