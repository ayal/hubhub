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
declare global {
    interface Window {
        hubhub: any;
    }
}
declare const _default: any;
export default _default;
