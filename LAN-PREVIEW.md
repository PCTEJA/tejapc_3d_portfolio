# Local Wi-Fi preview

The running preview serves the `public` directory on port 4173 and listens on all local interfaces. Its Wi-Fi address for this session is:

http://192.168.4.34:4173/

Open that address on a phone connected to the same Wi-Fi. Keep this laptop awake and the preview running. The address can change if the router assigns a new IP. This is a static preview; the AI assistant backend is unavailable here.

To restart the preview from this project directory:

```powershell
npm run preview
```

The server prints local network addresses and disables browser caching so changes are immediately visible. Set `HOST=127.0.0.1` in the process environment to use loopback-only hosting again.

## If the phone cannot connect

Windows denied the automated firewall-rule creation because the current process lacks administrator privileges. Run the following once in **PowerShell as Administrator** to allow this preview only from the local subnet through Wi-Fi:

```powershell
New-NetFirewallRule -DisplayName "Teja Portfolio Preview 4173 (local Wi-Fi)" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 4173 -LocalAddress 192.168.4.34 -RemoteAddress LocalSubnet -InterfaceAlias "Wi-Fi" -Profile Any
```

Remove this specific rule after previewing if desired:

```powershell
Remove-NetFirewallRule -DisplayName "Teja Portfolio Preview 4173 (local Wi-Fi)"
```

If the rule is present but the phone still cannot connect, confirm both devices are on the same non-guest Wi-Fi and that the router allows devices to communicate. No router port forwarding is needed.

Verified on the laptop: listener `0.0.0.0:4173`, HTTP 200 at the Wi-Fi address. Access from the phone requires a check on that device.
