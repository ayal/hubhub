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
class Document {
    constructor(collection, id) {
        this.id = id || hubhub_uuidv4();
        this.collection = collection;
    }
    set(data, persist = true) {
        return hubhub.set(this.collection, this.id, data, persist);
    }
    get(skip = 0, limit = 10) {
        return hubhub.get(this.collection, this.id, skip, limit);
    }
}
class Collection {
    constructor(name) {
        this.name = name;
    }
    get(skip = 0, limit = 10) {
        return hubhub.get(this.name, undefined, skip, limit);
    }
    doc(id) {
        return new Document(this.name, id);
    }
}
class HubHub {
    constructor() {
        this.onMessageCB = {};
        this.pubsubService = '';
        this.handler = (message) => { };
        this.inited = false;
        this.sender = { id: '', name: '' };
        this.hubhubid = '';
        console.log('hubhub ctor');
        this.ready = new Promise(resolve => this.resolveReady = resolve);
        this.authReady = new Promise(resolve => this.authResolve = resolve);
        this.hubhubid = hubhub_uuidv4();
    }
    auth(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const userBeforeAuth = yield this.authReady;
            console.log('hubhub: user before auth', userBeforeAuth);
            if (userBeforeAuth.nickname === name) {
                console.log('hubhub: already authed');
                return userBeforeAuth;
            }
            this.authReady = new Promise(resolve => this.authResolve = resolve);
            console.log('hubhub: authing', name);
            const res = yield fetch(`${this.pubsubService}/_functions/pubsubauth?name=${name}&hubhubid=${this.hubhubid}`);
            console.log('hubhub: auth res', res);
            const user = yield this.authReady;
            console.log('hubhub: auth ready res', user);
            return user;
        });
    }
    collection(name) {
        return new Collection(name);
    }
    init(pubsubService) {
        if (this.inited) {
            console.log('hubhub: not initing twice');
            return;
        }
        this.inited = true;
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
            framewrap.innerHTML = `<iframe src="${this.pubsubService}?hubhubid=${this.hubhubid}" title="hubhub id="hubhub-frame"></iframe>`;
            document.body.appendChild(framewrap);
            console.log('hubhub: embedded wix iframe...', this.pubsubService);
        }
        // prevent doubles
        console.log('hubhub: will listen to messages');
        this.handler = (message) => {
            if (message.data.pubsubready) {
                console.log('hubhub: got ready message');
                this.resolveReady && this.resolveReady();
            }
            if (message.data.pubsubauth) {
                const user = message.data.pubsubauth;
                console.log('hubhub: got auth ready message', user);
                this.sender = { id: user._id, name: user.nickname };
                this.authResolve && this.authResolve(user);
            }
            if (message.data.pubsub) {
                const doc = message.data.pubsub.payload;
                doc.data = JSON.parse(doc.data);
                console.log("hubhub: got message", message.data.pubsub);
                const cb = this.onMessageCB && this.onMessageCB[doc.collection];
                cb([doc]);
            }
        };
        window.addEventListener("message", this.handler);
    }
    kill() {
        console.log('hubhub: killing...');
    }
    get(collection, rid, skip = 0, limit = 10) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('hubhub: getting', collection, skip, limit);
            const res = yield fetch(`${this.pubsubService}/_functions/pubsubget?collection=${collection}${rid ? `&rid=${rid}` : ''}&skip=${skip}&limit=${limit}&hubhubid=${this.hubhubid}`);
            console.log('hubhub: get response', res);
            const docs = yield res.json();
            return docs.map((doc) => {
                doc.data = JSON.parse(doc.data);
                return doc;
            });
        });
    }
    on(collection, rid, cb) {
        if (this.onMessageCB[collection]) {
            console.warn('hubhub: not subscribing twice', collection);
            return;
        }
        console.log('hubhub: asking to subscribe to', collection, rid);
        this.onMessageCB[collection] = cb;
        return fetch(`${this.pubsubService}/_functions/pubsubsub?collection=${collection}&rid=${rid}&hubhubid=${this.hubhubid}`);
    }
    set(collection, rid, data, persist = true) {
        console.log('hubhub: sending', data);
        if (!data) {
            return;
        }
        const docobj = { sender: this.sender, data: JSON.stringify(data), doc_id: hubhub_uuidv4(), time: (new Date()).getTime() };
        const docstring = JSON.stringify(docobj);
        fetch(`${this.pubsubService}/_functions/pubsub?collection=${collection}&message=${docstring}${rid ? `&rid=${rid}` : ''}&persist=${persist}&hubhubid=${this.hubhubid}`);
        docobj.data = JSON.parse(docobj.data);
        return docobj;
    }
    update(doc_id, data) {
        fetch(`${this.pubsubService}/_functions/pubsubupdate?doc_id=${doc_id}&data=${JSON.stringify(data)}&hubhubid=${this.hubhubid}`);
    }
    delete(doc_id) {
        fetch(`${this.pubsubService}/_functions/pubsubdelete?doc_id=${doc_id}`);
    }
}
let hubhub = window.hubhub;
if (!hubhub) {
    hubhub = new HubHub();
    window.hubhub = hubhub;
}
export default window.hubhub;
//# sourceMappingURL=index.js.map