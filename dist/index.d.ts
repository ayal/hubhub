export interface MsgType {
    msg: string;
    sender_id?: string;
    msg_id: string;
    msg_time: number;
}
export interface HubHubType {
    onMessageCB(msgs: Array<MsgType>): void;
    subscribe(x: string, cb: (msgs: Array<MsgType>) => void): void;
    sendMessage(x: string, p: boolean): MsgType | undefined;
    get(room: string, skip: number): Promise<Array<MsgType>>;
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
    get(room: string, skip?: number): Promise<any>;
    subscribe(room: string, cb: (msgs: Array<MsgType>) => void): void;
    sendMessage(msg: string, persist?: boolean): MsgType | undefined;
    see(msg_id: string): void;
}
declare const hubhub: HubHub;
export default hubhub;
