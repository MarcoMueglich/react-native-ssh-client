import { TurboModule } from 'react-native';
export interface Spec extends TurboModule {
    connectToHostByPassword(host: string, port: number, username: string, passwordOrKey: string, key: string, callback: (error: string) => void): void;
    connectToHostByKey(host: string, port: number, username: string, passwordorKey: string, key: string, callback: (error: string) => void): void;
    execute(command: string, key: string, callback: (error: string, result: string) => void): void;
    startShell(key: string, ptyType: string, callback: (error: string, response: string) => void): void;
    writeToShell(str: string, key: string, callback: (error: string, response: string) => void): void;
    closeShell(key: string): void;
    disconnect(key: string): void;
}
declare const _default: Spec | null;
export default _default;
//# sourceMappingURL=NativeRTNSshClient.d.ts.map