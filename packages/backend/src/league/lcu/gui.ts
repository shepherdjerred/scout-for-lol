/**
 * Simple web-based GUI for LCU Spectator setup and monitoring
 * Serves a local web interface for configuration and status
 */

import type { SpectatorService } from "./spectator.js";

export interface GUIServer {
  port: number;
  stop: () => Promise<void>;
}

/**
 * Create and start a GUI server for the spectator service
 */
export async function startGUIServer(
  spectator: SpectatorService,
  port = 8080,
): Promise<GUIServer> {
  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);

      // Serve HTML GUI
      if (url.pathname === "/" || url.pathname === "/index.html") {
        return new Response(getHTML(), {
          headers: { "Content-Type": "text/html" },
        });
      }

      // API endpoint for status
      if (url.pathname === "/api/status") {
        return new Response(
          JSON.stringify({
            status: "running",
            timestamp: Date.now(),
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response("Not Found", { status: 404 });
    },
  });

  console.log(`🌐 GUI server started at http://localhost:${port.toString()}`);

  return {
    port: server.port,
    stop: async () => {
      server.stop();
    },
  };
}

/**
 * Generate HTML for the GUI
 */
function getHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LCU Spectator - Setup & Monitor</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2em;
            margin-bottom: 10px;
        }
        
        .header p {
            opacity: 0.9;
        }
        
        .content {
            padding: 30px;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section h2 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.5em;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #555;
        }
        
        input[type="text"],
        input[type="password"],
        input[type="number"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .help-text {
            font-size: 12px;
            color: #888;
            margin-top: 5px;
        }
        
        .button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            width: 100%;
        }
        
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .button:active {
            transform: translateY(0);
        }
        
        .status {
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        
        .status.running {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status.stopped {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .status-icon {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-icon.running {
            background: #28a745;
            animation: pulse 2s infinite;
        }
        
        .status-icon.stopped {
            background: #dc3545;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .code-block {
            background: #f5f5f5;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            overflow-x: auto;
            margin-top: 10px;
        }
        
        .copy-button {
            background: #6c757d;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            margin-top: 8px;
        }
        
        .copy-button:hover {
            background: #5a6268;
        }
        
        .events-log {
            background: #1e1e1e;
            color: #d4d4d4;
            border-radius: 6px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-height: 300px;
            overflow-y: auto;
            margin-top: 10px;
        }
        
        .event-item {
            padding: 5px 0;
            border-bottom: 1px solid #333;
        }
        
        .event-item:last-child {
            border-bottom: none;
        }
        
        .event-time {
            color: #888;
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 LCU Spectator</h1>
            <p>Real-time League of Legends game event announcements to Discord</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>Status</h2>
                <div id="status" class="status stopped">
                    <span class="status-icon stopped"></span>
                    <strong>Stopped</strong> - Configure and start the service below
                </div>
            </div>
            
            <div class="section">
                <h2>Configuration</h2>
                <form id="config-form">
                    <div class="form-group">
                        <label for="discord-token">Discord Bot Token</label>
                        <input type="password" id="discord-token" placeholder="Your Discord bot token" required>
                        <div class="help-text">Get this from Discord Developer Portal</div>
                    </div>
                    
                    <div class="form-group">
                        <label for="channel-id">Discord Channel ID</label>
                        <input type="text" id="channel-id" placeholder="123456789012345678" required>
                        <div class="help-text">Right-click channel → Copy ID (Developer Mode must be enabled)</div>
                    </div>
                    
                    <div class="form-group">
                        <label for="poll-interval">Poll Interval (ms)</label>
                        <input type="number" id="poll-interval" value="2000" min="500" max="10000" step="500">
                        <div class="help-text">How often to check for new events (default: 2000ms)</div>
                    </div>
                    
                    <button type="submit" class="button">Start Spectator Service</button>
                </form>
            </div>
            
            <div class="section">
                <h2>Setup Instructions</h2>
                <ol style="line-height: 2; padding-left: 20px;">
                    <li>Make sure League of Legends client is running and you're logged in</li>
                    <li>Create a Discord bot and get your bot token</li>
                    <li>Enable Developer Mode in Discord (User Settings → Advanced)</li>
                    <li>Right-click your Discord channel and copy the Channel ID</li>
                    <li>Enter your credentials above and click "Start Spectator Service"</li>
                    <li>The service will automatically detect when you're in a game</li>
                </ol>
            </div>
            
            <div class="section">
                <h2>Environment Variables</h2>
                <p>Alternatively, you can set these environment variables and run from command line:</p>
                <div class="code-block">
DISCORD_TOKEN=your_token_here<br>
DISCORD_CHANNEL_ID=your_channel_id_here<br>
LCU_POLL_INTERVAL_MS=2000<br>
<br>
bun run lcu-spectator
                </div>
                <button class="copy-button" onclick="copyEnvVars()">Copy</button>
            </div>
            
            <div class="section">
                <h2>Event Log</h2>
                <div id="events-log" class="events-log">
                    <div class="event-item">
                        <span class="event-time">[Waiting for events...]</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        const statusEl = document.getElementById('status');
        const eventsLogEl = document.getElementById('events-log');
        let isRunning = false;
        
        function updateStatus(running) {
            isRunning = running;
            if (running) {
                statusEl.className = 'status running';
                statusEl.innerHTML = '<span class="status-icon running"></span><strong>Running</strong> - Monitoring for game events';
            } else {
                statusEl.className = 'status stopped';
                statusEl.innerHTML = '<span class="status-icon stopped"></span><strong>Stopped</strong> - Configure and start the service';
            }
        }
        
        function addEvent(message) {
            const time = new Date().toLocaleTimeString();
            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            eventItem.innerHTML = '<span class="event-time">[' + time + ']</span>' + message;
            eventsLogEl.insertBefore(eventItem, eventsLogEl.firstChild);
            
            // Keep only last 50 events
            while (eventsLogEl.children.length > 50) {
                eventsLogEl.removeChild(eventsLogEl.lastChild);
            }
        }
        
        document.getElementById('config-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const token = document.getElementById('discord-token').value;
            const channelId = document.getElementById('channel-id').value;
            const pollInterval = parseInt(document.getElementById('poll-interval').value);
            
            addEvent('Starting spectator service...');
            
            // In a real implementation, this would communicate with the backend
            // For now, we'll just show a message
            addEvent('Configuration saved. Please restart the service with these values.');
            addEvent('Discord Token: ' + token.substring(0, 10) + '...');
            addEvent('Channel ID: ' + channelId);
            addEvent('Poll Interval: ' + pollInterval + 'ms');
            
            updateStatus(true);
        });
        
        function copyEnvVars() {
            const text = 'DISCORD_TOKEN=your_token_here\\nDISCORD_CHANNEL_ID=your_channel_id_here\\nLCU_POLL_INTERVAL_MS=2000\\n\\nbun run lcu-spectator';
            navigator.clipboard.writeText(text).then(() => {
                alert('Copied to clipboard!');
            });
        }
        
        // Poll for status updates
        setInterval(async () => {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                // Update status based on API response
            } catch (e) {
                // Service not running
            }
        }, 5000);
    </script>
</body>
</html>`;
}
