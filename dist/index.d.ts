export interface MsgType {
    msg: string;
    sender_id?: string;
    msg_id: string;
    msg_time: number;
}
export interface HubHubType {
    onMessageCB(msgs: Array<MsgType>): void;
    subscribe(x: string, cb: (msg: MsgType) => void): void;
    sendMessage(x: string): MsgType | undefined;
    room?: string;
    sender_id?: string;
    ready: Promise<boolean>;
    init(x: string): void;
}
declare class HubHub implements HubHubType {
    sender_id?: string | undefined;
    pubsubService?: string | undefined;
    onMessageCB: (msgs: MsgType[]) => void;
    room?: string | undefined;
    ready: Promise<boolean>;
    resolveReady?: () => void;
    constructor();
    init(pubsubService: string): void;
    subscribe(room: string, cb: (msg: MsgType) => void): void;
    sendMessage(msg: string): MsgType | undefined;
}
declare const hubhub: HubHub;
export default hubhub;
