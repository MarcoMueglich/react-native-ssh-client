package com.rtnsshclient;

import androidx.annotation.NonNull;
import android.util.Log;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import com.jcraft.jsch.Channel;
import com.jcraft.jsch.ChannelExec;
import com.jcraft.jsch.ChannelShell;
import com.jcraft.jsch.JSchException;
import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.IOException;
import java.util.Map;
import java.util.HashMap;
import java.util.Properties;
import com.rtnsshclient.NativeRTNSshClientSpec;

public class SshClientModule extends NativeRTNSshClientSpec {

    private class SSHClient {

        Session _session;
        String _key;
        BufferedReader _bufferedReader;
        DataOutputStream _dataOutputStream;
        Channel _channel = null;
    }

    public static String NAME = "RTNSshClient";

    private final ReactApplicationContext reactContext;
    private static final String LOGTAG = "RNSSHClient";

    Map<String, SSHClient> clientPool = new HashMap<>();

    SshClientModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    @Override
    public void connectToHostByPassword(final String host, final double port, final String username, final String passwordOrKey, final String key, final Callback callback) {
        connectToHost(host, (int) port, username, passwordOrKey, null, key, callback);
    }

    @Override
    public void connectToHostByKey(final String host, final double port, final String username, final String passwordOrKey, final String key, final Callback callback) {
        // For key-based authentication, we need to parse the passwordOrKey as a JSON string
        // This is a simplified version - you may need to enhance this based on your needs
        connectToHost(host, (int) port, username, null, null, key, callback);
    }

    private void connectToHost(final String host, final Integer port, final String username, final String password, final ReadableMap keyPairs, final String key, final Callback callback) {
        new Thread(new Runnable() {
            public void run() {
                try {
                    JSch jsch = new JSch();

                    if (password == null) {
                        byte[] privateKey = keyPairs.getString("privateKey").getBytes();
                        byte[] publicKey = keyPairs.hasKey("publicKey") ? keyPairs.getString("publicKey").getBytes() : null;
                        byte[] passphrase = keyPairs.hasKey("passphrase") ? keyPairs.getString("passphrase").getBytes() : null;
                        jsch.addIdentity("default", privateKey, publicKey, passphrase);
                    }

                    Session session = jsch.getSession(username, host, port);

                    if (password != null) {
                        session.setPassword(password);
                    }

                    Properties properties = new Properties();
                    properties.setProperty("StrictHostKeyChecking", "no");
                    session.setConfig(properties);
                    session.connect();

                    if (session.isConnected()) {
                        SSHClient client = new SSHClient();
                        client._session = session;
                        client._key = key;
                        clientPool.put(key, client);

                        Log.d(LOGTAG, "Session connected");
                        callback.invoke();
                    }
                } catch (JSchException error) {
                    Log.e(LOGTAG, "Connection failed: " + error.getMessage());
                    callback.invoke(error.getMessage());
                } catch (Exception error) {
                    Log.e(LOGTAG, "Connection failed: " + error.getMessage());
                    callback.invoke(error.getMessage());
                }
            }
        }).start();
    }

    @Override
    public void execute(final String command, final String key, final Callback callback) {
        new Thread(new Runnable() {
            public void run() {
                try {
                    SSHClient client = clientPool.get(key);
                    if (client == null) {
                        throw new Exception("client is null");
                    }
                    Session session = client._session;

                    ChannelExec channel = (ChannelExec) session.openChannel("exec");
                    channel.setCommand(command);
                    channel.connect();

                    String line, response = "";
                    InputStream in = channel.getInputStream();
                    BufferedReader reader = new BufferedReader(new InputStreamReader(in));
                    while ((line = reader.readLine()) != null) {
                        response += line + "\r\n";
                    }

                    callback.invoke(null, response);
                } catch (JSchException error) {
                    Log.e(LOGTAG, "Error executing command: " + error.getMessage());
                    callback.invoke(error.getMessage());
                } catch (Exception error) {
                    Log.e(LOGTAG, "Error executing command: " + error.getMessage());
                    callback.invoke(error.getMessage());
                }
            }
        }).start();
    }

    @Override
    public void startShell(final String key, final String ptyType, final Callback callback) {
        new Thread(new Runnable() {
            public void run() {
                try {
                    SSHClient client = clientPool.get(key);
                    if (client == null) {
                        throw new Exception("client is null");
                    }
                    Session session = client._session;

                    Channel channel = session.openChannel("shell");
                    ((ChannelShell) channel).setPtyType(ptyType);
                    channel.connect();

                    InputStream in = channel.getInputStream();
                    client._channel = channel;
                    client._bufferedReader = new BufferedReader(new InputStreamReader(in));
                    client._dataOutputStream = new DataOutputStream(channel.getOutputStream());

                    callback.invoke();

                    String line;
                    while (client._bufferedReader != null && (line = client._bufferedReader.readLine()) != null) {
                        WritableMap map = Arguments.createMap();
                        map.putString("name", "Shell");
                        map.putString("key", key);
                        map.putString("value", line + '\n');
                    }

                } catch (JSchException error) {
                    Log.e(LOGTAG, "Error starting shell: " + error.getMessage());
                    callback.invoke(error.getMessage());
                } catch (IOException error) {
                    Log.e(LOGTAG, "Error starting shell: " + error.getMessage());
                    callback.invoke(error.getMessage());
                } catch (Exception error) {
                    Log.e(LOGTAG, "Error sarting shell: " + error.getMessage());
                    callback.invoke(error.getMessage());
                }
            }
        }).start();
    }

    @Override
    public void writeToShell(final String str, final String key, final Callback callback) {
        new Thread(new Runnable() {
            public void run() {
                try {
                    SSHClient client = clientPool.get(key);
                    if (client == null) {
                        throw new Exception("client is null");
                    }
                    client._dataOutputStream.writeBytes(str);
                    client._dataOutputStream.flush();
                    callback.invoke();
                } catch (IOException error) {
                    Log.e(LOGTAG, "Error writing to shell:" + error.getMessage());
                    callback.invoke(error.getMessage());
                } catch (Exception error) {
                    Log.e(LOGTAG, "Error writing to shell:" + error.getMessage());
                    callback.invoke(error.getMessage());
                }
            }
        }).start();
    }

    @Override
    public void closeShell(final String key) {
        new Thread(new Runnable() {
            public void run() {
                try {
                    SSHClient client = clientPool.get(key);
                    if (client == null) {
                        throw new Exception("client is null");
                    }
                    if (client._channel != null) {
                        client._channel.disconnect();
                    }

                    if (client._dataOutputStream != null) {
                        client._dataOutputStream.flush();
                        client._dataOutputStream.close();
                    }

                    if (client._bufferedReader != null) {
                        client._bufferedReader.close();
                    }
                } catch (IOException error) {
                    Log.e(LOGTAG, "Error closing shell:" + error.getMessage());
                } catch (Exception error) {
                    Log.e(LOGTAG, "Error closing shell:" + error.getMessage());
                }
            }
        }).start();
    }

    @Override
    public void disconnect(final String key) {
        this.closeShell(key);

        SSHClient client = clientPool.get(key);
        if (client != null) {
            client._session.disconnect();
        }
    }
}
