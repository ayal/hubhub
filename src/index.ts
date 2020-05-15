`use strict`
function hubhub_uuidv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export interface SenderType {
    id:string;
    name:string;
}

export interface DocType {
    data: string;
    sender: SenderType;
    doc_id: string;
    time: number;
}

export interface HubHubType {
    on(collection: string, cb: (docs: Array<DocType>) => void): void,
    get(collection: string, skip: number): Promise<Array<DocType>>;
    set(collection: string, data: any, persist: boolean): DocType | undefined;
    auth(name:string):any;
    ready: Promise<boolean>;
    init(x: string): void;
    kill():void;
    sender:SenderType;
}

interface Callbacks {
    [collection: string]: (docs: Array<DocType>) => void;
}

declare global {
    interface Window { hubhub: any; }
}

class HubHub implements HubHubType {
    onMessageCB: Callbacks = {};
    public pubsubService?= '';
    ready: Promise<boolean>;
    resolveReady?: () => void;
    authResolve?: (user:any) => void;
    authReady: Promise<any>;
    handler=(message:any)=>{};
    inited = false;
    sender = {id:'',name:''};

    constructor() {
        console.log('hubhub ctor');
        this.ready = new Promise(resolve => this.resolveReady = resolve);
        this.authReady = new Promise(resolve => this.authResolve = resolve);
    }

    async auth(name:string) {
        const userBeforeAuth = await this.authReady;
        console.log('hubhub: user before auth', userBeforeAuth);
        if (userBeforeAuth.nickname === name) {
            console.log('hubhub: already authed');
            return userBeforeAuth;
        }
        this.authReady = new Promise(resolve => this.authResolve = resolve);
        console.log('hubhub: authing', name);

        const res = await fetch(
            `${this.pubsubService}/_functions/pubsubauth?name=${name}`
        );
        console.log('hubhub: auth res', res);
        const user = await this.authReady;
        console.log('hubhub: auth ready res', user);
        this.sender = {id:user._id, name:user.nickname};
        return user;
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
            framewrap.innerHTML = `<iframe src="${this.pubsubService}" title="hubhub id="hubhub-frame"></iframe>`;
            document.body.appendChild(framewrap);

            console.log('hubhub: embedded wix iframe...', this.pubsubService);
        }

        // prevent doubles
        console.log('hubhub: will listen to messages');
        this.handler = (message:any) => {
            if (message.data.pubsubready) {
                console.log('hubhub: got ready message');
                this.resolveReady && this.resolveReady();
            }

            if (message.data.pubsubauth) {
                const user = message.data.pubsubauth;
                console.log('hubhub: got auth ready message', user);
                this.authResolve && this.authResolve(user);
            }
    
            if (message.data.pubsub) {
                const doc = message.data.pubsub.payload;
                doc.data = JSON.parse(doc.data);
                console.log("hubhub: got message", message.data.pubsub);
                this.onMessageCB && this.onMessageCB[message.data.pubsub.payload.collection]([doc]);
    
            }
        }
        window.addEventListener("message", this.handler);
    }

    kill() {
        console.log('hubhub: killing...');
    }

    async get(collection: string, skip = 0) {
        console.log('hubhub: getting', collection, skip);

        const res = await fetch(
            `${this.pubsubService}/_functions/pubsubget?collection=${collection}&skip=${skip}`
        );

        console.log('hubhub: get response', res);
        const docs = await res.json();
        return docs.map((doc:any) => {
          doc.data = JSON.parse(doc.data);
          return doc;
        });
    }


    on(collection: string, cb: (docs: Array<DocType>) => void) {
        if (this.onMessageCB[collection]) {
            console.log('hubhub: not subscribing twice', collection);
            return;
        }
        console.log('hubhub: asking to subscribe to', collection);
        this.onMessageCB[collection] = cb;
        fetch(
            `${this.pubsubService}/_functions/pubsubsub?collection=${collection}`
        );
    }

    set(collection: string, data: any, persist = true) {
        console.log('hubhub: sending', data);
        if (!data) {
            return;
        }
        const docobj: DocType = { sender: this.sender, data: JSON.stringify(data), doc_id: hubhub_uuidv4(), time: (new Date()).getTime() };
        const docstring = JSON.stringify(docobj);
        fetch(
            `${this.pubsubService}/_functions/pubsub?collection=${collection}&message=${docstring}&persist=${persist}`
        );
        return docobj;
    }


    update(doc_id: string, data: any) {
        fetch(
            `${this.pubsubService}/_functions/pubsubupdate?doc_id=${doc_id}&data=${JSON.stringify(data)}`
        );
    }

}

let hubhub = window.hubhub;
if (!hubhub) {
    hubhub = new HubHub();
    window.hubhub = hubhub;
}
export default window.hubhub;


