`use strict`
const PUBSUB_WIX_SERVICE = `https://ayalg5.wixsite.com`;
const hubhub_uuidv4 = ()=> {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

class HubHub {
    constructor(pubsubService = PUBSUB_WIX_SERVICE) {
        this.pubsubService = pubsubService;
        this.sender_id = localStorage.getItem('hubhub_sender_id') || this.hubhub_uuidv4();
        localStorage.setItem('hubhub_sender_id', sender_id);
    }


    subscribe(room) {
        if (this.room) {
            console.log("already subscribed to a room:", this.room);
            return;
        }

        this.room = room;
        const framewrap = document.createElement('div');
        framewrap.hidden = true;
        framewrap.id = 'hubhub-frame-wrap';
        framewrap.innerHTML = `<iframe src="${this.pubsubService}/pubsub?room=${room}" title="hubhub id="hubhub-frame"></iframe>`;
        document.body.appendChild(framewrap);

        window.addEventListener("message", message => {
            if (message.data.pubsub) {
                const msg = JSON.parse(message.data.pubsub.payload);
                if (msg.sender_id === this.sender_id) { // filter myself
                    console.log("HUBHUB: got message", message.data.pubsub);
                    this.onMessageCB && this.onMessageCB(message.data.pubsub);
                }
            }
        });
    }

    sendMessage(msg) {
        if (!msg) {
            return;
        }
        const msgstring = JSON.stringify({ sender_id: this.sender_id, msg })
        fetch(
            `${this.pubsubService}/pubsub/_functions/pubsub?room=${this.room}&message=${msgstring}`
        );
    }

    onMessage(cb) {
        this.onMessageCB = cb;
    }
}

