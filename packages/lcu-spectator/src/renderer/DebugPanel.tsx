import React, { useState, useEffect, useRef } from "react";
import type { LogEntry } from "../../main/preload.js";

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DebugPanel({ isOpen, onClose }: DebugPanelProps): JSX.Element | null {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Load initial logs
    void loadLogs();

    // Set up log streaming
    const handleLogEntry = (entry: LogEntry): void => {
      setLogs((prev) => {
        const newLogs = [...prev, entry];
        // Keep only last 1000 entries
        return newLogs.slice(-1000);
      });
    };

    window.electron.onLogEntry(handleLogEntry);

    // No cleanup needed - IPC listeners are managed by Electron
  }, [isOpen]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const loadLogs = async (): Promise<void> => {
    try {
      const result = await window.electron.getLogs(1000);
      if (result.success) {
        setLogs(result.logs);
      }
    } catch (error) {
      console.error("Failed to load logs:", error);
    }
  };

  const handleClearLogs = async (): Promise<void> => {
    if (confirm("Are you sure you want to clear all logs?")) {
      const result = await window.electron.clearLogs();
      if (result.success) {
        setLogs([]);
      } else {
        alert(`Failed to clear logs: ${result.error ?? "Unknown error"}`);
      }
    }
  };

  const handleExportLogs = async (): Promise<void> => {
    const result = await window.electron.exportLogs();
    if (result.success && result.filePath) {
      alert(`Logs exported to: ${result.filePath}`);
    } else if (!result.cancelled) {
      alert(`Failed to export logs: ${result.error ?? "Unknown error"}`);
    }
  };

  const handleOpenLogsFolder = async (): Promise<void> => {
    const result = await window.electron.openLogsFolder();
    if (!result.success) {
      alert(`Failed to open logs folder: ${result.error ?? "Unknown error"}`);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterLevel === "ALL") {
      return true;
    }
    return log.level === filterLevel;
  });

  const getLevelColor = (level: string): string => {
    switch (level) {
      case "DEBUG":
        return "#6c757d";
      case "INFO":
        return "#17a2b8";
      case "WARN":
        return "#ffc107";
      case "ERROR":
        return "#dc3545";
      default:
        return "#333";
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="debug-panel-overlay" onClick={onClose}>
      <div className="debug-panel" onClick={(e) => e.stopPropagation()}>
        <div className="debug-panel-header">
          <h2>Debug Logs</h2>
          <div className="debug-panel-controls">
            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="filter-select">
              <option value="ALL">All Levels</option>
              <option value="DEBUG">Debug</option>
              <option value="INFO">Info</option>
              <option value="WARN">Warn</option>
              <option value="ERROR">Error</option>
            </select>
            <label className="auto-scroll-label">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              Auto-scroll
            </label>
            <button onClick={loadLogs} className="debug-button">
              Refresh
            </button>
            <button onClick={handleClearLogs} className="debug-button">
              Clear
            </button>
            <button onClick={handleExportLogs} className="debug-button">
              Export
            </button>
            <button onClick={handleOpenLogsFolder} className="debug-button">
              Open Folder
            </button>
            <button onClick={onClose} className="debug-button debug-button-close">
              Close
            </button>
          </div>
        </div>
        <div className="debug-panel-content" ref={logContainerRef}>
          {filteredLogs.length === 0 ? (
            <div className="debug-empty">No logs available</div>
          ) : (
            filteredLogs.map((log, index) => (
              <div key={index} className="debug-log-entry">
                <span className="debug-log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className="debug-log-level" style={{ color: getLevelColor(log.level) }}>
                  [{log.level}]
                </span>
                <span className="debug-log-message">{log.message}</span>
                {log.data && (
                  <pre className="debug-log-data">{JSON.stringify(log.data, null, 2)}</pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
