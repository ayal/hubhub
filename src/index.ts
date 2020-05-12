`use strict`
function hubhub_uuidv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export interface DocType {
    data: string;
    sender_id?: string;
    doc_id: string;
    time: number;
}

export interface HubHubType {
    on(collection:string, cb: (docs: Array<DocType>) => void): void,
    get(collection:string, skip:number):Promise<Array<DocType>>;
    set(collection:string, data:any, persist:boolean):DocType|undefined;
    sender_id?: string;
    ready: Promise<boolean>;
    init(x: string): void;
}

interface Callbacks {
    [collection:string]:(docs: Array<DocType>) => void;
}

class HubHub implements HubHubType {
    onMessageCB: Callbacks = {};
    sender_id?= ''
    public pubsubService?= '';
    ready: Promise<boolean>;
    resolveReady?: () => void;

    constructor() {
        this.sender_id = localStorage.getItem('hubhub_sender_id') || hubhub_uuidv4();
        localStorage.setItem('hubhub_sender_id', this.sender_id);
        this.ready = new Promise(resolve => this.resolveReady = resolve);
    }

    init(pubsubService: string) {
        this.pubsubService = pubsubService;

        if (document.getElementById('hubhub-frame-wrap')) {
            // already embedded so make sure ready
            this.resolveReady && this.resolveReady();
            console.warn('hubhub: not embedding twice');
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
         window.addEventListener("message", message => {
             if (message.data.pubsuball) {
                 const docs = message.data.pubsuball;
                 console.log("hubhub: got past messages", docs);
                 this.onMessageCB && this.onMessageCB[message.data.pubsuball.collection](docs);
             }
 
             if (message.data.pubsubready) {
                 console.log('hubhub: got ready message');
                 this.resolveReady && this.resolveReady();
             }
 
             if (message.data.pubsub) {
                 const doc = message.data.pubsub.payload;
                 console.log("hubhub: got message", message.data.pubsub);
                 this.onMessageCB && this.onMessageCB[message.data.pubsub.payload.collection]([doc]);
 
             }
         });
    }

    async get(collection:string, skip=0) {
        console.log('hubhub: getting', collection, skip);

        const res = await fetch(
            `${this.pubsubService}/_functions/pubsubget?collection=${collection}&skip=${skip}`
        );

        console.log('hubhub: get response', res);
        return res.json();
    }


    on(collection:string, cb: (docs: Array<DocType>) => void) {
        this.onMessageCB[collection] = cb; 
    }

    set(collection: string, data:any, persist=true) {
        console.log('hubhub: sending', data);
        if (!data) {
            return;
        }
        const docobj: DocType = { sender_id: this.sender_id, data:JSON.stringify(data), doc_id: hubhub_uuidv4(), time: (new Date()).getTime()};
        const docstring = JSON.stringify(docobj);
        fetch(
            `${this.pubsubService}/_functions/pubsub?collection=${collection}&message=${docstring}&persist=${persist}`
        );
        return docobj;
    }


    update(doc_id:string, data:any) {
        fetch(
            `${this.pubsubService}/_functions/pubsubupdate?doc_id=${doc_id}&sender_id=${this.sender_id}&data=${data}`
        );
    }

}

const hubhub = new HubHub();
export default hubhub;


