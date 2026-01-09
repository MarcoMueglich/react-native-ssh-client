/**
 * Represents the types of PTY (pseudo-terminal) for SSH connections.
 */
export declare enum PtyType {
    VANILLA = "vanilla",
    VT100 = "vt100",
    VT102 = "vt102",
    VT220 = "vt220",
    ANSI = "ansi",
    XTERM = "xterm"
}
/**
 * Represents a callback function with an optional response.
 * @template T The type of the response.
 * @param error The error object, if any.
 * @param response The response object, if any.
 */
export type CallbackFunction<T> = (error: string, response?: T) => void;
/**
 * Represents a key pair used for SSH authentication.
 */
export interface KeyPair {
    privateKey: string;
    publicKey?: string;
    passphrase?: string;
}
/**
 * Represents a password or key for authentication.
 */
export type PasswordOrKey = string | KeyPair;
/**
 * Represents an SSH client that can connect to a remote server and perform various operations.
 * Instances of SSHClient are created using the following factory functions:
 * - SSHClient.connectWithKey()
 * - SSHClient.connectWithPassword()
 */
export default class SSHClient {
    /**
     * Connects to an SSH server using a private key for authentication.
     *
     * @param host - The hostname or IP address of the SSH server.
     * @param port - The port number of the SSH server.
     * @param username - The username for authentication.
     * @param privateKey - The private key for authentication.
     * @param passphrase - The passphrase for the private key (optional).
     * @param callback - A callback function to handle the connection result (optional).
     *
     * @returns A Promise that resolves to an instance of SSHClient if the connection is successful.
     *          Otherwise, it rejects with an error.
     */
    static connectWithKey(host: string, port: number, username: string, privateKey: string, passphrase?: string, callback?: CallbackFunction<SSHClient>): Promise<SSHClient>;
    /**
     * Connects to an SSH server using password authentication.
     *
     * @param host - The hostname or IP address of the SSH server.
     * @param port - The port number of the SSH server.
     * @param username - The username for authentication.
     * @param password - The password for authentication.
     * @param callback - Optional callback function to handle any errors during the connection process.
     * @returns A Promise that resolves to an instance of SSHClient if the connection is successful.
     * @throws If there is an error during the connection process.
     */
    static connectWithPassword(host: string, port: number, username: string, password: string, callback?: CallbackFunction<SSHClient>): Promise<SSHClient>;
    private _key;
    private _activeStream;
    private host;
    private port;
    private username;
    /**
     * Creates a new SSHClient instance.
     * Should not be called directly; use the `connectWithKey` or `connectWithPassword` factory functions instead.
     * @param host The hostname or IP address of the SSH server.
     * @param port The port number of the SSH server.
     * @param username The username for authentication.
     * @param passwordOrKey The password or private key for authentication.
     * @param callback The callback function to be called after the connection is established.
     */
    constructor(host: string, port: number, username: string, passwordOrKey: PasswordOrKey, callback: CallbackFunction<void>);
    /**
     * Generates a random client key, used to identify which callback match with which instance.
     *
     * @returns A string representing the random client key.
     */
    private static getRandomClientKey;
    /**
     * Connects to the SSH server using the provided password or key.
     *
     * @param passwordOrKey - The password or key to authenticate with the server.
     * @param callback - The callback function to be called after the connection attempt.
     */
    private connect;
    /**
     * Executes a command on the SSH server.
     * @param command The command to execute.
     * @param callback Optional callback function to handle the result asynchronously.
     * @returns A promise that resolves with the response from the server.
     */
    execute(command: string, callback?: CallbackFunction<string>): Promise<string>;
    /**
     * Starts a shell session on the SSH server.
     * @param ptyType - The type of pseudo-terminal to use for the shell session.
     * @param callback - Optional callback function to handle the response.
     * @returns A promise that resolves with the response from the server.
     */
    startShell(ptyType: PtyType, callback?: CallbackFunction<string>): Promise<string>;
    /**
     * Checks if the shell is active. If the shell is already active, it returns an empty string.
     * Otherwise, it starts a new shell and returns the result.
     * @param callback Optional callback function to handle errors.
     * @returns A promise that resolves to a string representing the result of the shell check.
     */
    private checkShell;
    /**
     * Writes a command to the shell.
     * @param command - The command to write to the shell.
     * @param callback - Optional callback function to handle the response.
     * @returns A promise that resolves with the response from the shell.
     */
    writeToShell(command: string, callback?: CallbackFunction<string>): Promise<string>;
    /**
     * Closes the SSH shell.
     */
    closeShell(): void;
    /**
     * Disconnects the SSH client.
     * If a shell is active, it will be closed.
     * If an SFTP connection is active, it will be disconnected.
     * @returns void
     */
    disconnect(): void;
}
//# sourceMappingURL=sshclient.d.ts.map