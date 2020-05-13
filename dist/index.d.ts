export interface DocType {
    data: string;
    sender_id?: string;
    doc_id: string;
    time: number;
}
export interface HubHubType {
    on(collection: string, cb: (docs: Array<DocType>) => void): void;
    get(collection: string, skip: number): Promise<Array<DocType>>;
    set(collection: string, data: any, persist: boolean): DocType | undefined;
    sender_id?: string;
    ready: Promise<boolean>;
    init(x: string): void;
    kill(): void;
}
interface Callbacks {
    [collection: string]: (docs: Array<DocType>) => void;
}
declare class HubHub implements HubHubType {
    onMessageCB: Callbacks;
    sender_id?: string | undefined;
    pubsubService?: string | undefined;
    ready: Promise<boolean>;
    resolveReady?: () => void;
    handler: (message: any) => void;
    constructor();
    init(pubsubService: string): void;
    kill(): void;
    get(collection: string, skip?: number): Promise<any>;
    on(collection: string, cb: (docs: Array<DocType>) => void): void;
    set(collection: string, data: any, persist?: boolean): DocType | undefined;
    update(doc_id: string, data: any): void;
}
declare const hubhub: HubHub;
export default hubhub;
