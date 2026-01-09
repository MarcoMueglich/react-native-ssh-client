# react-native-ssh-client

A React Native module for SSH client functionality, enabling secure shell connections from your React Native applications.

## Disclaimer

This package is based on the code from [react-native-ssh-sftp](https://github.com/dylankenneally/react-native-ssh-sftp) by Dylan Kenneally. The original package supports the old React Native architecture. This module adapts that code to work with React Native's new architecture (TurboModules).

## Features

- 🔐 SSH connection with password or private key authentication
- 💻 Execute remote commands
- 🖥️ Interactive shell sessions with PTY support
- ⚡ Built with React Native's new architecture (TurboModules)
- 🤖 Only Android support

## Installation

```bash
npm install react-native-ssh-client
```

Or with yarn:

```bash
yarn add react-native-ssh-client
```

## Usage

### Connecting with Password

```typescript
import SSHClient from "react-native-ssh-client";

const client = await SSHClient.connectWithPassword(
  "example.com", // host
  22, // port
  "username", // username
  "password" // password
);
```

### Executing Commands

```typescript
// Execute a single command
const output = await client.execute("ls -la");
console.log(output);

// With callback
client.execute("whoami", (error, result) => {
  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log("Result:", result);
});
```

### Interactive Shell

```typescript
import { PtyType } from "react-native-ssh-client";

// Start a shell session
await client.startShell(PtyType.XTERM);

// Write commands to the shell
const response = await client.writeToShell("cd /var/log\n");
console.log(response);

// Execute more commands
const logs = await client.writeToShell("cat syslog | head -n 20\n");
console.log(logs);

// Close the shell when done
client.closeShell();
```

### Disconnecting

```typescript
// Disconnect when done
client.disconnect();
```

## API Reference

### `SSHClient`

#### Static Methods

##### `connectWithPassword(host, port, username, password, callback?)`

Connects to an SSH server using password authentication.

- **host**: `string` - The hostname or IP address
- **port**: `number` - The SSH port (usually 22)
- **username**: `string` - The username for authentication
- **password**: `string` - The password for authentication
- **callback**: `CallbackFunction<SSHClient>` (optional) - Callback for connection result
- **Returns**: `Promise<SSHClient>`

#### Instance Methods

##### `execute(command, callback?)`

Executes a command on the SSH server.

- **command**: `string` - The command to execute
- **callback**: `CallbackFunction<string>` (optional) - Callback for the result
- **Returns**: `Promise<string>` - The command output

##### `startShell(ptyType, callback?)`

Starts an interactive shell session.

- **ptyType**: `PtyType` - The type of pseudo-terminal to use
- **callback**: `CallbackFunction<string>` (optional) - Callback for the response
- **Returns**: `Promise<string>`

##### `writeToShell(command, callback?)`

Writes a command to the active shell.

- **command**: `string` - The command to write
- **callback**: `CallbackFunction<string>` (optional) - Callback for the response
- **Returns**: `Promise<string>` - The shell output

##### `closeShell()`

Closes the active shell session.

##### `disconnect()`

Disconnects from the SSH server.

### `PtyType` Enum

Available PTY types for shell sessions:

- `PtyType.VANILLA` - Basic terminal
- `PtyType.VT100` - VT100 terminal emulation
- `PtyType.VT102` - VT102 terminal emulation
- `PtyType.VT220` - VT220 terminal emulation
- `PtyType.ANSI` - ANSI terminal emulation
- `PtyType.XTERM` - XTerm terminal emulation

## Example

```typescript
import SSHClient, { PtyType } from "react-native-ssh-client";

async function performSSHOperations() {
  try {
    // Connect
    const client = await SSHClient.connectWithPassword(
      "example.com",
      22,
      "admin",
      "secure-password"
    );

    // Execute a command
    const uptime = await client.execute("uptime");
    console.log("Server uptime:", uptime);

    // Start interactive shell
    await client.startShell(PtyType.XTERM);

    // Run commands in shell
    await client.writeToShell("cd /var/www\n");
    const files = await client.writeToShell("ls -la\n");
    console.log("Files:", files);

    // Cleanup
    client.closeShell();
    client.disconnect();
  } catch (error) {
    console.error("SSH Error:", error);
  }
}
```

## Platform Support

- ✅ Android
- ⏳ iOS (not yet supported)

## Requirements

- React Native >= 0.68
- Android minSdkVersion 21

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © Marco Mueglich

## Author

Marco Mueglich

## Repository

[https://github.com/MarcoMueglich/react-native-ssh-client](https://github.com/MarcoMueglich/react-native-ssh-client)

## Issues

Report issues at: [https://github.com/MarcoMueglich/react-native-ssh-client/issues](https://github.com/MarcoMueglich/react-native-ssh-client/issues)
