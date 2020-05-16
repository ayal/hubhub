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
    on(collection: string, cb: (docs: Array<DocType>) => void): void;
    get(collection: string, skip: number): Promise<Array<DocType>>;
    set(collection: string, data: any, persist: boolean): DocType | undefined;
    update(collection: string, data: any): void;
    auth(name: string): any;
    ready: Promise<boolean>;
    authReady: Promise<any>;
    init(x: string): void;
    kill(): void;
    sender: SenderType;
}
declare global {
    interface Window {
        hubhub: any;
    }
}
declare const _default: HubHubType;
export default _default;
