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
    on(collection: string, rid: string, cb: (docs: Array<DocType>) => void): void;
    get(collection: string, rid: string | undefined, skip: number, limit: number): Promise<Array<DocType>>;
    set(collection: string, rid: string, data: any, persist: boolean): DocType | undefined;
    update(collection: string, data: any): void;
    auth(name: string): any;
    ready: Promise<boolean>;
    authReady: Promise<any>;
    init(x: string): void;
    kill(): void;
    sender: SenderType;
    collection(name: string): Collection;
}
declare global {
    interface Window {
        hubhub: any;
    }
}
declare class Document {
    id: string;
    collection: string;
    constructor(collection: string, id?: string);
    set(data: object, persist?: boolean): DocType | undefined;
    get(skip?: number, limit?: number): Promise<DocType[]>;
}
declare class Collection {
    name: string;
    constructor(name: string);
    get(skip?: number, limit?: number): Promise<DocType[]>;
    doc(id?: string): Document;
}
declare const _default: HubHubType;
export default _default;
