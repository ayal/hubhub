`use strict`
function hubhub_uuidv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export interface SenderType {
    id: string;
    name: string;
}

export interface DocType {
    data: any;
    sender: SenderType;
    doc_id: string;
    time: number;
}

export interface HubHubType {
    on(collection: string, rid: string, cb: (docs: Array<DocType>) => void): void,
    get(collection: string, rid: string | undefined, skip: number, limit: number): Promise<Array<DocType>>;
    set(collection: string, rid: string, data: any, persist: boolean): DocType | undefined;
    update(collection: string, data: any): void;

    auth(name: string): any;
    ready: Promise<boolean>;
    authReady: Promise<any>;
    init(x: string): void;
    kill(): void;
    sender: SenderType;

    collection(name:string):Collection;
}

interface Callbacks {
    [collection: string]: (docs: Array<DocType>) => void;
}

declare global {
    interface Window { hubhub: any; }
}

class Document {
    id: string;
    collection:string;
    constructor(collection:string, id?: string) {
        this.id = id || hubhub_uuidv4();
        this.collection = collection;
    }
    set(data:object, persist=true) {
        return hubhub.set(this.collection, this.id, data, persist)
    }
    get(skip = 0, limit = 10) {
        return hubhub.get(this.collection, this.id, skip, limit);
    }
}

class Collection {
    name: string;
    constructor(name: string) {
        this.name = name;
    }
    get(skip = 0, limit = 10) {
        return hubhub.get(this.name, undefined, skip, limit);
    }
    doc(id?: string) {
        return new Document(this.name, id);
    }

}

class HubHub implements HubHubType {
    onMessageCB: Callbacks = {};
    public pubsubService?= '';
    ready: Promise<boolean>;
    authReady: Promise<any>;
    resolveReady?: () => void;
    authResolve?: (user: any) => void;
    handler = (message: any) => { };
    inited = false;
    sender = { id: '', name: '' };
    hubhubid = '';

    constructor() {
        console.log('hubhub ctor');
        this.ready = new Promise(resolve => this.resolveReady = resolve);
        this.authReady = new Promise(resolve => this.authResolve = resolve);
        this.hubhubid = hubhub_uuidv4();
    }

    async auth(name: string) {
        const userBeforeAuth = await this.authReady;
        console.log('hubhub: user before auth', userBeforeAuth);
        if (userBeforeAuth.nickname === name) {
            console.log('hubhub: already authed');
            return userBeforeAuth;
        }
        this.authReady = new Promise(resolve => this.authResolve = resolve);
        console.log('hubhub: authing', name);

        const res = await fetch(
            `${this.pubsubService}/_functions/pubsubauth?name=${name}&hubhubid=${this.hubhubid}`
        );
        console.log('hubhub: auth res', res);
        const user = await this.authReady;
        console.log('hubhub: auth ready res', user);
        return user;
    }

    collection(name: string) {
        return new Collection(name);
    }

    init(pubsubService: string) {
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
        this.handler = (message: any) => {
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
        }
        window.addEventListener("message", this.handler);
    }

    kill() {
        console.log('hubhub: killing...');
    }

    async get(collection: string, rid: string, skip = 0, limit = 10) {
        console.log('hubhub: getting', collection, skip, limit);

        const res = await fetch(
            `${this.pubsubService}/_functions/pubsubget?collection=${collection}&rid=${rid}&skip=${skip}&limit=${limit}&hubhubid=${this.hubhubid}`
        );

        console.log('hubhub: get response', res);
        const docs = await res.json();
        return docs.map((doc: any) => {
            doc.data = JSON.parse(doc.data);
            return doc;
        });
    }


    on(collection: string, rid: string, cb: (docs: Array<DocType>) => void) {
        if (this.onMessageCB[collection]) {
            console.warn('hubhub: not subscribing twice', collection);
            return;
        }
        console.log('hubhub: asking to subscribe to', collection, rid);
        this.onMessageCB[collection] = cb;
        return fetch(
            `${this.pubsubService}/_functions/pubsubsub?collection=${collection}&rid=${rid}&hubhubid=${this.hubhubid}`
        );
    }

    set(collection: string, rid: string, data: any, persist = true) {
        console.log('hubhub: sending', data);
        if (!data) {
            return;
        }
        const docobj: DocType = { sender: this.sender, data: JSON.stringify(data), doc_id: hubhub_uuidv4(), time: (new Date()).getTime() };
        const docstring = JSON.stringify(docobj);
        fetch(
            `${this.pubsubService}/_functions/pubsub?collection=${collection}&message=${docstring}${rid ? `&rid=${rid}` : ''}&persist=${persist}&hubhubid=${this.hubhubid}`
        );
        docobj.data = JSON.parse(docobj.data);
        return docobj;
    }


    update(doc_id: string, data: any) {
        fetch(
            `${this.pubsubService}/_functions/pubsubupdate?doc_id=${doc_id}&data=${JSON.stringify(data)}&hubhubid=${this.hubhubid}`
        );
    }

    delete(doc_id: string) {
        fetch(
            `${this.pubsubService}/_functions/pubsubdelete?doc_id=${doc_id}`
        );
    }


}

let hubhub: HubHubType = window.hubhub;
if (!hubhub) {
    hubhub = new HubHub();
    window.hubhub = hubhub;
}
export default (window.hubhub as HubHubType);


