import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  connectToHostByPassword(
    host: string,
    port: number,
    username: string,
    passwordOrKey: string,
    key: string,
    callback: (error: string) => void,
  ): void;
  connectToHostByKey(
    host: string,
    port: number,
    username: string,
    passwordorKey: string,
    key: string,
    callback: (error: string) => void,
  ): void;
  // generateKeyPair(
  //   type: string,
  //   passphrase: string,
  //   keySize: number,
  //   comment: string,
  //   callback: (
  //     error: string | null,
  //     keymap: { publicKey: string; privateKey: string } | null,
  //   ) => void,
  // ): void;
  // getKeyDetails(privateKey: string, promise: Promise<Map<string, string | number>>): void;
  execute(
    command: string,
    key: string,
    callback: (error: string, result: string) => void,
  ): void;
  startShell(
    key: string,
    ptyType: string,
    callback: (error: string, response: string) => void,
  ): void;
  writeToShell(
    str: string,
    key: string,
    callback: (error: string, response: string) => void,
  ): void;
  closeShell(key: string): void;
  disconnect(key: string): void;
}

export default TurboModuleRegistry.get<Spec>('RTNSshClient') as Spec | null;
