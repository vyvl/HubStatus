declare module "nmdc" {
    export class Nmdc {
        constructor(options?: Options, onConnect?: Function);
        raw(raw: string, cb: Function): Nmdc;
        say(message: string, cb?: Function): Nmdc;
        pm(user: string, message: string, cb: Function): Nmdc;
        disconnect(): Nmdc;
        setAutoReconnect(enable: boolean): Nmdc;
        reconnect(): Nmdc;
        getIsConnected(): boolean;
        getHubName(): string;
        onSystem(message: string): void;
        onPublic(username: string, message: string): void;
        onPrivate(username: string, message: string): void;
        onUserJoin(username: string): void;
        onUserPart(username: string): void;
        onUserUpdate(username: string): void;
        onDebug(message: string): void;
        onConnect(): void;
        onClosed(): void;
        onHubNameChange(name: string): void;
        static STATE_CONNECTED: number;
        static STATE_DISCONNECTED: number;
        hubName: string;
        opts: Options;
        users: any;
    }

    interface Options {
        address?: string;      // Connection address
        port?: number;              // Connection port
        tls?: boolean;            // TLS (set true for NMDCS)
        password?: string;               // Password; if required for nick
        auto_reconnect?: boolean;            // Attempt reconnect if disconnected (60 seconds)
        encoding?: string;           // Hub text encoding
        nick?: string;   // Your nick
        desc?: string;               // Your description
        tag?: string;        // Your tag
        share?: number;                // Your share size
        follow_redirects?: boolean;          // Follow $ForceMove commands  
        ignore_chat_failures?: boolean;       // Swallow exceptions in .say() and .pm()
        shouldInstantConnect?: boolean;        // Connect after object construction
    }

}