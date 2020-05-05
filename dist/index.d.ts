export interface MsgType {
    self: boolean;
    msg: string;
    sender_id: string;
    msg_id: string;
}
export interface HubHubType {
    onMessageCB(msg: MsgType): void;
    subscribe(x: string, cb: (msg: MsgType) => void): void;
    sendMessage(x: string): void;
    room?: string;
    sender_id?: string;
    ready: Promise<boolean>;
    init(x: string): void;
}
declare class HubHub implements HubHubType {
    sender_id?: string | undefined;
    pubsubService?: string | undefined;
    onMessageCB: (msg: MsgType) => void;
    room?: string | undefined;
    ready: Promise<boolean>;
    resolveReady?: () => void;
    constructor();
    init(pubsubService: string): void;
    subscribe(room: string, cb: (msg: MsgType) => void): void;
    sendMessage(msg: string): Promise<void>;
}
declare const hubhub: HubHub;
export default hubhub;
