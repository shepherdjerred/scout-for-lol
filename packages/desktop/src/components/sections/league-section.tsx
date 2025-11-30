import { Gamepad2, Link2, Unlink, User, Zap } from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatusIndicator,
  Badge,
} from "@scout-for-lol/desktop/components/ui/index.ts";

type LcuStatus = {
  connected: boolean;
  summonerName: string | null;
  inGame: boolean;
};

type LeagueSectionProps = {
  lcuStatus: LcuStatus;
  loading: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
};

export function LeagueSection({ lcuStatus, loading, onConnect, onDisconnect }: LeagueSectionProps) {
  const isConnecting = loading?.includes("League");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-100">League Client</h2>
        <p className="mt-1 text-gray-400">Connect to your League of Legends client to enable game monitoring</p>
      </div>

      {/* Main Card */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                lcuStatus.connected ? "bg-discord-green/20 text-discord-green" : "bg-gray-700/50 text-gray-400"
              }`}
            >
              <Gamepad2 className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Connection Status</CardTitle>
              <div className="mt-1">
                <StatusIndicator
                  status={isConnecting ? "connecting" : lcuStatus.connected ? "connected" : "disconnected"}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Summoner Info */}
          {lcuStatus.connected && lcuStatus.summonerName && (
            <div className="flex items-center gap-4 rounded-lg bg-gray-900/50 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-lol-gold/20 to-lol-accent/20 ring-2 ring-lol-gold/30">
                <User className="h-7 w-7 text-lol-gold" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Logged in as</p>
                <p className="text-lg font-semibold text-gray-100">{lcuStatus.summonerName}</p>
              </div>
              {lcuStatus.inGame && (
                <Badge variant="success" dot pulse className="ml-auto">
                  In Game
                </Badge>
              )}
            </div>
          )}

          {/* Connection Info */}
          {!lcuStatus.connected && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-700/50 bg-gray-900/30 p-4">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-200">
                  <Zap className="h-4 w-4 text-discord-yellow" />
                  How it works
                </h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-500" />
                    Make sure League of Legends is running
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-500" />
                    Scout will auto-detect the client and connect
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-500" />
                    Enable &quot;Live Client Data API&quot; in League settings for full features
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            {!lcuStatus.connected ? (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={onConnect}
                loading={isConnecting}
                icon={<Link2 className="h-5 w-5" />}
              >
                Connect to League Client
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={onDisconnect}
                loading={isConnecting}
                icon={<Unlink className="h-5 w-5" />}
              >
                Disconnect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
