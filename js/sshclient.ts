import { Platform } from 'react-native';
import RTNSshClient from './NativeRTNSshClient';

/**
 * Represents the types of PTY (pseudo-terminal) for SSH connections.
 */
export enum PtyType {
  VANILLA = 'vanilla',
  VT100 = 'vt100',
  VT102 = 'vt102',
  VT220 = 'vt220',
  ANSI = 'ansi',
  XTERM = 'xterm',
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
  static connectWithKey(
    host: string,
    port: number,
    username: string,
    privateKey: string,
    passphrase?: string,
    callback?: CallbackFunction<SSHClient>,
  ): Promise<SSHClient> {
    return new Promise((resolve, reject) => {
      const result = new SSHClient(
        host,
        port,
        username,
        { privateKey, passphrase },
        (error: string) => {
          if (callback) {
            callback(error);
          }

          if (error) {
            return reject(error);
          }

          resolve(result);
        },
      );
    });
  }

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
  static connectWithPassword(
    host: string,
    port: number,
    username: string,
    password: string,
    callback?: CallbackFunction<SSHClient>,
  ): Promise<SSHClient> {
    return new Promise((resolve, reject) => {
      const result = new SSHClient(host, port, username, password, (error: string) => {
        if (callback) {
          callback(error);
        }

        if (error) {
          return reject(error);
        }

        resolve(result);
      });
    });
  }

  // "unique" key to identify callback from native library
  private _key: string;
  private _activeStream: { sftp: boolean; shell: boolean };
  private host: string;
  private port: number;
  private username: string;

  /**
   * Creates a new SSHClient instance.
   * Should not be called directly; use the `connectWithKey` or `connectWithPassword` factory functions instead.
   * @param host The hostname or IP address of the SSH server.
   * @param port The port number of the SSH server.
   * @param username The username for authentication.
   * @param passwordOrKey The password or private key for authentication.
   * @param callback The callback function to be called after the connection is established.
   */
  constructor(
    host: string,
    port: number,
    username: string,
    passwordOrKey: PasswordOrKey,
    callback: CallbackFunction<void>,
  ) {
    this._key = SSHClient.getRandomClientKey();
    this._activeStream = {
      sftp: false,
      shell: false,
    };
    this.host = host;
    this.port = port;
    this.username = username;
    this.connect(passwordOrKey, callback);
  }

  /**
   * Generates a random client key, used to identify which callback match with which instance.
   *
   * @returns A string representing the random client key.
   */
  private static getRandomClientKey(): string {
    // TODO This should be returned by the native code
    // There's no need for actual randomness, just uniqueness.
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  /**
   * Connects to the SSH server using the provided password or key.
   *
   * @param passwordOrKey - The password or key to authenticate with the server.
   * @param callback - The callback function to be called after the connection attempt.
   */
  private connect(passwordOrKey: PasswordOrKey, callback: CallbackFunction<void>): void {
    if (Platform.OS === 'android') {
      if (typeof passwordOrKey === 'string') {
        RTNSshClient?.connectToHostByPassword(
          this.host,
          this.port,
          this.username,
          passwordOrKey,
          this._key,
          (error: string) => {
            callback(error);
          },
        );
      } else {
        RTNSshClient?.connectToHostByKey(
          this.host,
          this.port,
          this.username,
          passwordOrKey.toString(),
          this._key,
          (error: string) => {
            callback(error);
          },
        );
      }

      return;
    }
  }

  /**
   * Executes a command on the SSH server.
   * @param command The command to execute.
   * @param callback Optional callback function to handle the result asynchronously.
   * @returns A promise that resolves with the response from the server.
   */
  execute(command: string, callback?: CallbackFunction<string>): Promise<string> {
    return new Promise((resolve, reject) => {
      RTNSshClient?.execute(command, this._key, (error: string, response: string) => {
        if (callback) {
          callback(error, response ?? null);
        }

        if (error) {
          return reject(error);
        }

        resolve(response);
      });
    });
  }

  /**
   * Starts a shell session on the SSH server.
   * @param ptyType - The type of pseudo-terminal to use for the shell session.
   * @param callback - Optional callback function to handle the response.
   * @returns A promise that resolves with the response from the server.
   */
  startShell(ptyType: PtyType, callback?: CallbackFunction<string>): Promise<string> {
    if (this._activeStream.shell) {
      return Promise.resolve('');
    }

    return new Promise((resolve, reject) => {
      RTNSshClient?.startShell(this._key, ptyType, (error: string, response: string) => {
        if (callback) {
          callback(error, response);
        }

        if (error) {
          return reject(error);
        }

        this._activeStream.shell = true;
        resolve(response);
      });
    });
  }

  /**
   * Checks if the shell is active. If the shell is already active, it returns an empty string.
   * Otherwise, it starts a new shell and returns the result.
   * @param callback Optional callback function to handle errors.
   * @returns A promise that resolves to a string representing the result of the shell check.
   */
  private checkShell(callback?: CallbackFunction<string>): Promise<string> {
    if (this._activeStream.shell) {
      return Promise.resolve('');
    }

    return this.startShell(PtyType.VANILLA)
      .then((res) => (res ? res + '\n' : ''))
      .catch((error: string) => {
        if (callback) {
          callback(error);
        }

        throw error;
      });
  }

  /**
   * Writes a command to the shell.
   * @param command - The command to write to the shell.
   * @param callback - Optional callback function to handle the response.
   * @returns A promise that resolves with the response from the shell.
   */
  writeToShell(command: string, callback?: CallbackFunction<string>): Promise<string> {
    return this.checkShell(callback).then(
      () =>
        new Promise((resolve, reject) => {
          RTNSshClient?.writeToShell(
            command,
            this._key,
            (error: string, response: string) => {
              if (callback) {
                callback(error, response);
              }

              if (error) {
                return reject(error);
              }

              resolve(response);
            },
          );
        }),
    );
  }

  /**
   * Closes the SSH shell.
   */
  closeShell(): void {
    // TODO this should use a callback too
    RTNSshClient?.closeShell(this._key);
    this._activeStream.shell = false;
  }

  /**
   * Disconnects the SSH client.
   * If a shell is active, it will be closed.
   * If an SFTP connection is active, it will be disconnected.
   * @returns void
   */
  disconnect(): void {
    if (this._activeStream.shell) {
      this.closeShell();
    }

    // TODO this should use a callback too
    RTNSshClient?.disconnect(this._key);
  }
}
