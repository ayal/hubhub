"use strict";
function hubhub_uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
var HubHub = /** @class */ (function () {
    function HubHub(pubsubService) {
        this.sender_id = '';
        this.pubsubService = '';
        this.onMessageCB = function (msg) { };
        this.room = '';
        this.pubsubService = pubsubService;
        this.sender_id = localStorage.getItem('hubhub_sender_id') || hubhub_uuidv4();
        localStorage.setItem('hubhub_sender_id', this.sender_id);
    }
    HubHub.prototype.subscribe = function (room, cb) {
        var _this = this;
        if (this.room) {
            console.log("already subscribed to a room:", this.room);
            return;
        }
        this.onMessageCB = cb;
        console.log('embedding wix iframe...', this.pubsubService, this.room);
        this.room = room;
        var framewrap = document.createElement('div');
        framewrap.hidden = true;
        framewrap.id = 'hubhub-frame-wrap';
        framewrap.innerHTML = "<iframe src=\"" + this.pubsubService + "?room=" + room + "\" title=\"hubhub id=\"hubhub-frame\"></iframe>";
        document.body.appendChild(framewrap);
        console.log('embedded wix iframe...', this.pubsubService);
        window.addEventListener("message", function (message) {
            if (message.data.pubsub) {
                var msg = JSON.parse(message.data.pubsub.payload);
                if (msg.sender_id === _this.sender_id) { // filter myself
                    msg.self = true;
                }
                console.log("HUBHUB: got message", message.data.pubsub);
                _this.onMessageCB && _this.onMessageCB(msg);
            }
        });
    };
    HubHub.prototype.sendMessage = function (msg) {
        if (!msg) {
            return;
        }
        var msgstring = JSON.stringify({ sender_id: this.sender_id, msg: msg });
        fetch(this.pubsubService + "/_functions/pubsub?room=" + this.room + "&message=" + msgstring);
    };
    return HubHub;
}());
export { HubHub };
//# sourceMappingURL=index.js.map