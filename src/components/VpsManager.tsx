import React, { useState, useEffect } from "react";
import { Server, Cpu, Play, Square, RotateCw, Shield, Database, Terminal, ShieldAlert, Wifi, Globe, Trash2, Plus, CornerDownRight, Key, Mail, Activity, Download, Settings, Layers, Clock, Sliders, Calendar, TrendingUp, ChevronDown, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { VPSInstance } from "../types";

const INITIAL_VPS: VPSInstance[] = [
  {
    id: "vps-ubuntu-01",
    name: "production-monolith-01",
    os: "ubuntu",
    region: "US East (N. Virginia)",
    ip: "104.244.18.29",
    status: "running",
    specs: { vcpu: 4, ram: 16, storage: 120 },
    firewalls: [
      { port: 22, protocol: "TCP", allowed: "0.0.0.0/0 (Global SSH)" },
      { port: 80, protocol: "TCP", allowed: "0.0.0.0/0 (HTTP web traffic)" },
      { port: 443, protocol: "TCP", allowed: "0.0.0.0/0 (HTTPS secure layer)" }
    ],
    backups: [
      { date: "2026-05-21 02:00 UTC", size: "4.2 GB", status: "success" },
      { date: "2026-05-14 02:00 UTC", size: "4.1 GB", status: "success" }
    ],
    project: "Alpha-Core",
    tags: ["prod", "frontend", "api"],
    alerts: {
      cpuThreshold: 85,
      ramThreshold: 90,
      email: "ops-manager@nebulahost.dev",
      enabled: true
    }
  },
  {
    id: "vps-debian-02",
    name: "security-proxy-cache",
    os: "debian",
    region: "EU Central (Frankfurt)",
    ip: "89.207.132.88",
    status: "stopped",
    specs: { vcpu: 2, ram: 4, storage: 40 },
    firewalls: [
      { port: 22, protocol: "TCP", allowed: "192.168.1.0/24 (HQ Intranet)" },
      { port: 8080, protocol: "TCP", allowed: "0.0.0.0/0 (Standard Proxy)" }
    ],
    backups: [
      { date: "2026-05-20 04:15 UTC", size: "1.1 GB", status: "success" }
    ],
    project: "SecOps-Gate",
    tags: ["proxy", "security"],
    alerts: {
      cpuThreshold: 75,
      ramThreshold: 80,
      email: "sysops@nebulahost.dev",
      enabled: false
    }
  }
];

export interface LoadBalancer {
  id: string;
  name: string;
  algorithm: "round-robin" | "least-connections" | "ip-hash";
  targetPort: number;
  ip: string;
  nodeIds: string[];
  status: "active" | "error";
  healthCheckPath: string;
  throughput: string;
  activeConn: number;
}

const INITIAL_CLUSTERS: LoadBalancer[] = [
  {
    id: "lb-web-01",
    name: "alpha-core-ingress-lb",
    algorithm: "round-robin",
    targetPort: 80,
    ip: "104.244.18.100",
    nodeIds: ["vps-ubuntu-01"],
    status: "active",
    healthCheckPath: "/health",
    throughput: "4.2 MB/s",
    activeConn: 142
  },
  {
    id: "lb-proxy-02",
    name: "secops-gateway-proxy-lb",
    algorithm: "ip-hash",
    targetPort: 8080,
    ip: "89.207.132.110",
    nodeIds: ["vps-debian-02"],
    status: "active",
    healthCheckPath: "/api/check",
    throughput: "1.1 MB/s",
    activeConn: 39
  }
];

export default function VpsManager() {
  const [instances, setInstances] = useState<VPSInstance[]>(INITIAL_VPS);
  const [selectedVps, setSelectedVps] = useState<VPSInstance | null>(INITIAL_VPS[0]);
  
  // Tab/Navigation Views
  const [activeView, setActiveView] = useState<"nodes" | "clusters">("nodes");

  // Clusters / Load Balancer States
  const [clusters, setClusters] = useState<LoadBalancer[]>(INITIAL_CLUSTERS);
  const [selectedClusterId, setSelectedClusterId] = useState<string>("lb-web-01");
  const [clusterName, setClusterName] = useState("");
  const [clusterAlgo, setClusterAlgo] = useState<LoadBalancer["algorithm"]>("round-robin");
  const [clusterPort, setClusterPort] = useState(80);
  const [clusterHealthPath, setClusterHealthPath] = useState("/healthz");

  // Terminal Customizations
  const [terminalTheme, setTerminalTheme] = useState<"emerald" | "amethyst" | "amber" | "slate" | "crimson">("emerald");
  const [terminalFontSize, setTerminalFontSize] = useState<"xs" | "sm" | "md" | "lg">("xs");

  // Active detail subsections
  const [activeDetailTab, setActiveDetailTab] = useState<"terminal" | "diagnostics">("terminal");

  // Real-time Diagnostics
  const [diskRead, setDiskRead] = useState(12.4);
  const [diskWrite, setDiskWrite] = useState(4.2);
  const [netRx, setNetRx] = useState(256.4);
  const [netTx, setNetTx] = useState(102.8);
  const [diskReadHist, setDiskReadHist] = useState<number[]>([12, 15, 8, 12, 14, 9, 13, 11, 16, 12]);
  const [diskWriteHist, setDiskWriteHist] = useState<number[]>([4, 6, 3, 5, 4, 3, 6, 4, 5, 4]);
  const [netRxHist, setNetRxHist] = useState<number[]>([210, 220, 180, 240, 260, 210, 250, 230, 271, 256]);
  const [netTxHist, setNetTxHist] = useState<number[]>([95, 110, 95, 105, 100, 92, 104, 98, 112, 102]);

  // Snapshot scheduler schedules
  const [snapshotSchedules, setSnapshotSchedules] = useState<{[key: string]: { enabled: boolean; interval: "hourly" | "daily" | "weekly" | "custom"; customCron: string; lastRun: string; nextRun: string }}>({
    "vps-ubuntu-01": {
      enabled: true,
      interval: "daily",
      customCron: "0 0 * * *",
      lastRun: "2026-05-22 00:00 UTC",
      nextRun: "2026-05-23 00:00 UTC"
    },
    "vps-debian-02": {
      enabled: false,
      interval: "weekly",
      customCron: "0 0 * * 0",
      lastRun: "Never",
      nextRun: "Not Scheduled"
    }
  });

  // Creation States
  const [vpsName, setVpsName] = useState("");
  const [vpsOs, setVpsOs] = useState<VPSInstance["os"]>("ubuntu");
  const [vpsRegion, setVpsRegion] = useState("US East (N. Virginia)");
  const [vCpu, setVCpu] = useState(2);
  const [ram, setRam] = useState(8);
  const [storage, setStorage] = useState(80);
  const [vpsProject, setVpsProject] = useState("");
  const [vpsTags, setVpsTags] = useState("");

  // Grouping Modes
  const [groupBy, setGroupBy] = useState<"none" | "project" | "tag">("none");

  // Threshold alert editing states
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [editCpuThreshold, setEditCpuThreshold] = useState(80);
  const [editRamThreshold, setEditRamThreshold] = useState(80);
  const [editAlertEmail, setEditAlertEmail] = useState("");
  const [editAlertEnabled, setEditAlertEnabled] = useState(true);

  // Collapsed categories states
  const [collapsedProjects, setCollapsedProjects] = useState<{[key: string]: boolean}>({});

  const toggleProjectCollapse = (project: string) => {
    setCollapsedProjects(prev => ({
      ...prev,
      [project]: !prev[project]
    }));
  };

  const openAlertModal = () => {
    if (selectedVps) {
      setEditCpuThreshold(selectedVps.alerts?.cpuThreshold ?? 80);
      setEditRamThreshold(selectedVps.alerts?.ramThreshold ?? 80);
      setEditAlertEmail(selectedVps.alerts?.email ?? "root@nebulaHost.local");
      setEditAlertEnabled(selectedVps.alerts?.enabled ?? true);
      setIsAlertModalOpen(true);
    }
  };

  const saveAlertSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVps) return;
    const updatedAlerts = {
      cpuThreshold: editCpuThreshold,
      ramThreshold: editRamThreshold,
      email: editAlertEmail,
      enabled: editAlertEnabled,
    };
    const updatedVps = {
      ...selectedVps,
      alerts: updatedAlerts
    };
    setInstances(instances.map(inst => inst.id === selectedVps.id ? updatedVps : inst));
    setSelectedVps(updatedVps);
    setIsAlertModalOpen(false);

    setTerminalHistory(prev => [
      ...prev,
      `[MONITOR-CONFIG] ⚙️ Threshold alert profiles updated.`,
      `[MONITOR-CONFIG] CPU alert threshold: ${editCpuThreshold}% | RAM Memory alert threshold: ${editRamThreshold}%`,
      `[MONITOR-CONFIG] Alerts: ${editAlertEnabled ? "ENABLED" : "DISABLED"} | Target notification queue: ${editAlertEmail}`
    ]);
  };

  // Firewall creation states
  const [fwPort, setFwPort] = useState(8080);
  const [fwProtocol, setFwProtocol] = useState<"TCP" | "UDP">("TCP");
  const [fwSource, setFwSource] = useState("0.0.0.0/0");

  // SSH Terminal simulator & command history
  const [terminalInput, setTerminalInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("nebula_command_history");
      return saved ? JSON.parse(saved) : ["help", "neofetch", "htop"];
    } catch {
      return ["help", "neofetch", "htop"];
    }
  });
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    "Nebula SecureShell API v2.9 Connection Established.",
    "root@nebulaHost-monolith-01:~# curl https://api.nebulahost.dev/health",
    '{"status": "online", "secured": true}',
    "root@nebulaHost-monolith-01:~# _ type help, htop, docker ps, df -h or check to see terminal simulation. Scroll history using Up/Down arrow keys."
  ]);

  // Filters & Search modes
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>("all");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Simulated metrics monitoring for threshold alerts
  const [cpuUsage, setCpuUsage] = useState<number>(45.3);
  const [ramUsage, setRamUsage] = useState<number>(61.2);
  const [lastAlertTimes, setLastAlertTimes] = useState<{[key: string]: number}>({});

  // Telemetry auto-refresh and frequency options
  const [isLiveRefreshEnabled, setIsLiveRefreshEnabled] = useState(true);
  const [refreshFrequency, setRefreshFrequency] = useState(3000); // 1000, 3000, 5000 (1s, 3s, 5s)

  // Maximize diagnostics state
  const [isDiagnosticsMaximized, setIsDiagnosticsMaximized] = useState(false);

  // Quick action processing feeds
  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);
  const [diagnosticsLog, setDiagnosticsLog] = useState<string>("All hardware checks passing. Hypervisor operating healthy.");

  // Metric historic timeseries data mapping last 30 minutes
  interface TelemetryDataPoint {
    timestamp: string;
    cpu: number;
    ram: number;
    diskRead: number;
    diskWrite: number;
  }
  const [telemetryHistoryLog, setTelemetryHistoryLog] = useState<TelemetryDataPoint[]>([]);
  const [selectedChartType, setSelectedChartType] = useState<"all" | "cpu" | "ram" | "disk">("all");

  const generateTelemetryHistory = (vpsName: string) => {
    const historicalPoints: TelemetryDataPoint[] = [];
    const now = Date.now();
    for (let i = 30; i >= 0; i--) {
      const timeOffset = i * 60 * 1000; // 30 mins ago to now, step by 1 min
      const logTime = new Date(now - timeOffset).toISOString();
      historicalPoints.push({
        timestamp: logTime,
        cpu: +(Math.floor(Math.random() * 25) + 30 + Math.sin(i / 5) * 10).toFixed(1),
        ram: +(Math.floor(Math.random() * 15) + 45 + Math.cos(i / 10) * 5).toFixed(1),
        diskRead: +(Math.floor(Math.random() * 15) + 5).toFixed(1),
        diskWrite: +(Math.floor(Math.random() * 8) + 2).toFixed(1)
      });
    }
    return historicalPoints;
  };

  useEffect(() => {
    try {
      localStorage.setItem("nebula_command_history", JSON.stringify(commandHistory));
    } catch (e) {
      console.error("Failed to save command history:", e);
    }
  }, [commandHistory]);

  // Fluctuating real-time diagnostics task
  useEffect(() => {
    if (!isLiveRefreshEnabled) return;

    const intervalId = setInterval(() => {
      let currentDr = 12.4;
      let currentDw = 4.2;
      let currentCpu = 45.3;
      let currentRam = 61.2;

      setDiskRead((prev) => {
        const next = Math.max(0.5, +(prev + (Math.random() * 4 - 2)).toFixed(1));
        currentDr = next;
        setDiskReadHist((h) => [...h.slice(1), Math.round(next)]);
        return next;
      });
      setDiskWrite((prev) => {
        const next = Math.max(0.1, +(prev + (Math.random() * 2 - 1)).toFixed(1));
        currentDw = next;
        setDiskWriteHist((h) => [...h.slice(1), Math.round(next)]);
        return next;
      });
      setNetRx((prev) => {
        const next = Math.max(10, +(prev + (Math.random() * 80 - 40)).toFixed(1));
        setNetRxHist((h) => [...h.slice(1), Math.round(next)]);
        return next;
      });
      setNetTx((prev) => {
        const next = Math.max(5, +(prev + (Math.random() * 30 - 15)).toFixed(1));
        setNetTxHist((h) => [...h.slice(1), Math.round(next)]);
        return next;
      });
      setCpuUsage((prev) => {
        const change = Math.random() * 12 - 6; // -6 to +6%
        const next = Math.max(5, Math.min(99, +(prev + change).toFixed(1)));
        currentCpu = next;
        return next;
      });
      setRamUsage((prev) => {
        const change = Math.random() * 4 - 2; // -2 to +2%
        const next = Math.max(10, Math.min(99, +(prev + change).toFixed(1)));
        currentRam = next;
        return next;
      });

      setTelemetryHistoryLog((prev) => {
        const nowStr = new Date().toISOString();
        const nextPoint: TelemetryDataPoint = {
          timestamp: nowStr,
          cpu: currentCpu,
          ram: currentRam,
          diskRead: currentDr,
          diskWrite: currentDw
        };
        const updated = [...prev, nextPoint];
        const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;
        return updated.filter(p => new Date(p.timestamp).getTime() > thirtyMinsAgo);
      });
    }, refreshFrequency);

    return () => clearInterval(intervalId);
  }, [isLiveRefreshEnabled, refreshFrequency]);

  // Update baseline CPU & RAM on selected VPS variation
  useEffect(() => {
    if (!selectedVps) return;
    const baselineCpu = Math.floor(Math.random() * 25) + 25; // 25 - 50%
    const baselineRam = Math.floor(Math.random() * 30) + 30; // 30 - 60%
    setCpuUsage(baselineCpu);
    setRamUsage(baselineRam);

    // Seed realistic 30 minutes of historical telemetry entries
    setTelemetryHistoryLog(generateTelemetryHistory(selectedVps.name));
  }, [selectedVps?.id]);

  // Alert simulation triggers
  const triggerSimulatedEmailAlert = (vps: VPSInstance, alarmType: string, currentVal: number, threshold: number, emailAddress: string) => {
    setTestAlertToast({
      vpsName: vps.name,
      type: alarmType,
      value: currentVal,
      email: emailAddress
    });

    setTerminalHistory(prev => [
      ...prev,
      `[SYSTEM-MONITOR] 🚨 THRESHOLD EXCEEDED: ${alarmType.toUpperCase()}`,
      `[SYSTEM-MONITOR] Current utilization reached ${currentVal}% (configured alert limit: ${threshold}%) on hypervisor instance node ${vps.name}.`,
      `[SYSTEM-MONITOR] Spooling alert payload protocol transmission to mail relay server SMTP...`,
      `[SYSTEM-MONITOR] Simulated email notification successfully transmitted to target inbox: "${emailAddress}"`
    ]);

    setTimeout(() => {
      setTestAlertToast(null);
    }, 5500);
  };

  // Monitor alert thresholds
  useEffect(() => {
    if (!selectedVps || !selectedVps.alerts?.enabled) return;
    const { cpuThreshold, ramThreshold, email } = selectedVps.alerts;
    if (!email) return;

    const now = Date.now();

    if (cpuUsage > cpuThreshold) {
      const last = lastAlertTimes[`${selectedVps.id}-cpu`] || 0;
      if (now - last > 45000) { // 45 seconds cooldown
        setLastAlertTimes(prev => ({ ...prev, [`${selectedVps.id}-cpu`]: now }));
        triggerSimulatedEmailAlert(selectedVps, "CPU Overload Warning", cpuUsage, cpuThreshold, email);
      }
    }

    if (ramUsage > ramThreshold) {
      const last = lastAlertTimes[`${selectedVps.id}-ram`] || 0;
      if (now - last > 45000) { // 45 seconds cooldown
        setLastAlertTimes(prev => ({ ...prev, [`${selectedVps.id}-ram`]: now }));
        triggerSimulatedEmailAlert(selectedVps, "RAM Capacity Alarm", ramUsage, ramThreshold, email);
      }
    }
  }, [cpuUsage, ramUsage, selectedVps, lastAlertTimes]);

  // Alert simulation states
  const [testAlertToast, setTestAlertToast] = useState<{ vpsName: string; type: string; value: number; email: string } | null>(null);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmdInput = terminalInput.trim();
    if (!cmdInput) return;

    // Append to typed commands if it's new/different
    if (commandHistory[commandHistory.length - 1] !== cmdInput) {
      setCommandHistory([...commandHistory, cmdInput]);
    }
    setHistoryIndex(-1);

    const cmd = cmdInput.toLowerCase();
    let reply = "";

    switch (cmd) {
      case "help":
        reply = "Available simulation directives: 'ls', 'htop', 'docker ps', 'df -h', 'uname -a', 'clear', 'neofetch'";
        break;
      case "ls":
        reply = "total 24K\ndrwxr-xr-x 3 root root 4.0K May 22 13:45 .\ndrwxr-xr-x 1 root root 4.0K May 22 13:45 ..\n-rw-r--r-- 1 root root  220 May 22 13:45 .bashrc\n-rw-r--r-- 1 root root 3.1K May 22 13:45 .profile\ndrwxr-xr-x 2 root root 4.0K May 22 13:45 app-source\n-rwxr-xr-x 1 root root 5.8K May 22 13:45 deploy.sh";
        break;
      case "htop":
        reply = "Tasks: 59, 117 thr; 1 running\nCPU [||||||||||||||||||||               41.8%] core:4\nMem [||||||||||||||||||||||             64.2%] 10.2G / 16.0G\nSwp [                                    0.0%] 0K / 2.0G\n\n  PID USER      PRI  NI  VIRT   RES   SHR S CPU% MEM%   TIME+  Command\n 4812 root       20   0  1.2G  410M   64M S  8.4  2.5  1:44.20 node server.js\n 4831 root       20   0  884M  122M   10M S  4.1  0.7  0:12.82 db-relay";
        break;
      case "docker ps":
        reply = "CONTAINER ID   IMAGE                  COMMAND                  CREATED       STATUS       PORTS\n312fa818b29f   redis:7-alpine         \"docker-entrypoint.s…\"   2 hours ago   Up 2 hours   6379/tcp\na87dfdfc89d1   nebulahost/gateway:2   \"node src/gateway.js\"    2 days ago    Up 22 hours  3000->3000/tcp";
        break;
      case "df -h":
        reply = `Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        ${selectedVps?.specs.storage || 120}G   54G   ${(selectedVps?.specs.storage || 120) - 54}G  45% /`;
        break;
      case "uname -a":
        reply = `Linux nebulaHost-monolith-01 6.1.0-21-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.90-1 x86_64 GNU/Linux`;
        break;
      case "neofetch":
        reply = `   .-.\n  (o o)      NebulaOS v4.1\n  | O |      OS: Debian GNU/Linux 12\n   \\_\\_      Kernel: 6.1.0-21-amd64\n             Uptime: 2 days, 22 hours\n             Shell: bash 5.2.15\n             CPU: Nebula vCPU v4v (4 cores)\n             RAM: 10424MB / 16189MB\n             Region: ${selectedVps?.region || "Unknown"}`;
        break;
      case "clear":
        setTerminalHistory([]);
        setTerminalInput("");
        return;
      default:
        reply = `bash: command not found: ${cmdInput}. For list of simulated commands check 'help'.`;
    }

    setTerminalHistory([
      ...terminalHistory,
      `root@nebulaHost-vps:~# ${cmdInput}`,
      reply
    ]);
    setTerminalInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setTerminalInput(commandHistory[newIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      if (historyIndex === commandHistory.length - 1) {
        setHistoryIndex(-1);
        setTerminalInput("");
      } else {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setTerminalInput(commandHistory[newIndex]);
      }
    }
  };

  const handleToggleAlerts = () => {
    if (!selectedVps) return;
    const currentEnabled = selectedVps.alerts?.enabled ?? false;
    const updatedAlerts = {
      cpuThreshold: selectedVps.alerts?.cpuThreshold ?? 80,
      ramThreshold: selectedVps.alerts?.ramThreshold ?? 80,
      email: selectedVps.alerts?.email ?? "alerts@nebulahost.dev",
      enabled: !currentEnabled
    };
    const updated = {
      ...selectedVps,
      alerts: updatedAlerts
    };
    setInstances(instances.map(inst => inst.id === selectedVps.id ? updated : inst));
    setSelectedVps(updated);

    setTerminalHistory(prev => [
      ...prev,
      `[ALERTS] Threshold notification system is now ${!currentEnabled ? "ENABLED" : "DISABLED"} for VM cluster ID ${selectedVps.id}.`
    ]);
  };

  const handleAlertChange = (field: "cpuThreshold" | "ramThreshold" | "email", value: any) => {
    if (!selectedVps) return;
    const updatedAlerts = {
      cpuThreshold: selectedVps.alerts?.cpuThreshold ?? 80,
      ramThreshold: selectedVps.alerts?.ramThreshold ?? 80,
      email: selectedVps.alerts?.email ?? "",
      enabled: selectedVps.alerts?.enabled ?? true,
      [field]: value
    };
    const updated = {
      ...selectedVps,
      alerts: updatedAlerts
    };
    setInstances(instances.map(inst => inst.id === selectedVps.id ? updated : inst));
    setSelectedVps(updated);
  };

  const handleSendTestAlertEmail = () => {
    if (!selectedVps || !selectedVps.alerts) return;
    const { cpuThreshold, ramThreshold, email } = selectedVps.alerts;

    // Trigger visual toast banner
    setTestAlertToast({
      vpsName: selectedVps.name,
      type: "Hypervisor Overload",
      value: cpuThreshold,
      email: email
    });

    // Append mock trigger log to CLI terminal history
    setTerminalHistory(prev => [
      ...prev,
      `[ALERTS-TEST] Dispatching threshold verification diagnostic packet...`,
      `[ALERTS-TEST] Trigger state evaluation: COMPUTE OVERLOAD (Detected: CPU 91.2% > threshold limit ${cpuThreshold}%)`,
      `[ALERTS-TEST] Email notification transmitted successfully to: ${email}`,
      `[ALERTS-TEST] Response code: 250 OK (SMTP Relay handshake complete)`
    ]);

    setTimeout(() => {
      setTestAlertToast(null);
    }, 4500);
  };

  const handleGenerateSSHKey = () => {
    if (!selectedVps) return;

    // Simulate cryptographic prime generation for a 4096-bit RSA key pair
    const p = Math.floor(Math.random() * 10000000) + 7919;
    const q = Math.floor(Math.random() * 10000000) + 104729;
    const modulus = (BigInt(p) * BigInt(q)).toString();
    const exponent = "65537";

    // Format PEM block styled 4096-bit private key
    const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIJKQIBAAKCAgEAv7d2C4LqpM7UytLd2PqD8l/lE8c9Nf/M3t+vA6Rz2L7XU/H9
m8Z7hD97U+7sH6pL5pZnt/8R3tY7L8s/N+9sHg8N+SaehH8/p3N4D+9K7X/Z8tPf
Modulus_Bits: 4096
Simulated_Prime_P: ${p}
Simulated_Prime_Q: ${q}
Simulated_RSA_Modulus: ${modulus}
Simulated_Exp: ${exponent}
v0b7ePHz+M3u+E/e3D+fE+9f/G8r/+M9z9w/E8L/Nf//Mz/+fE3u/8tPf0b7ePH/
MIIJKQIBAAKCAgEAytLd2PqD8l/lE9f/M3t+vA6Rz2L7XU==
-----END RSA PRIVATE KEY-----`;

    const publicKey = `ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDv7d2C4LqpM7UytLd2PqD8l/lE8c9Nf/M3t+vA6Rz2L7XU/H9m8Z7hD97U+7sH6pL5pZnt/8R3tY7L8s/N+9sHg8N+SaehH8/p3N4D+9K7X/Z8tPf/v0b7ePH+M3u+E/e3D+fE+9f/G8r/+M9z9w/E8L/Nf//Mz/+fE3u/8tPf0b7ePH/ root@nebula-rsa-${selectedVps.name}`;

    // Private key download
    const privBlob = new Blob([privateKey], { type: "text/plain;charset=utf-8" });
    const privUrl = URL.createObjectURL(privBlob);
    const privLink = document.createElement("a");
    privLink.href = privUrl;
    privLink.download = `${selectedVps.name}_id_rsa.pem`;
    privLink.click();
    URL.revokeObjectURL(privUrl);

    // Public key download
    const pubBlob = new Blob([publicKey], { type: "text/plain;charset=utf-8" });
    const pubUrl = URL.createObjectURL(pubBlob);
    const pubLink = document.createElement("a");
    pubLink.href = pubUrl;
    pubLink.download = `${selectedVps.name}_id_rsa.pub`;
    pubLink.click();
    URL.revokeObjectURL(pubUrl);

    setTerminalHistory(prev => [
      ...prev,
      `[SECURITY-RSA] 🔑 Running local Pseudo-Random Prime Number Generator (PRNG)...`,
      `[SECURITY-RSA] Prime p = ${p}, q = ${q} successfully selected.`,
      `[SECURITY-RSA] Calculated 4096-bit RSA modulo mathematical constant.`,
      `[SECURITY-RSA] Formulated fresh 4096-bit high-entropy RSA cryptographic private token file.`,
      `[SECURITY-RSA] Initiating dual key stream download payloads...`,
      `[SECURITY-RSA] Private Key downloaded: "${selectedVps.name}_id_rsa.pem" (Never share this file!)`,
      `[SECURITY-RSA] Public Key downloaded: "${selectedVps.name}_id_rsa.pub"`
    ]);
  };

  const createVps = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vpsName) return;

    const parsedTags = vpsTags
      ? vpsTags.split(",").map(t => t.trim()).filter(Boolean)
      : [];

    const newInst: VPSInstance = {
      id: `vps-${Math.random().toString(36).substr(2, 6)}`,
      name: vpsName.toLowerCase().replace(/\s+/g, "-"),
      os: vpsOs,
      region: vpsRegion,
      ip: `198.51.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`,
      status: "running",
      specs: { vcpu: vCpu, ram: ram, storage: storage },
      firewalls: [
        { port: 22, protocol: "TCP", allowed: "0.0.0.0/0" },
        { port: 80, protocol: "TCP", allowed: "0.0.0.0/0" }
      ],
      backups: [
        { date: "Created Just Now", size: "320 KB", status: "success" }
      ],
      project: vpsProject.trim() || "Alpha-Core",
      tags: parsedTags.length > 0 ? parsedTags : ["staging"],
      alerts: {
        cpuThreshold: 80,
        ramThreshold: 80,
        email: "alerts@nebulahost.dev",
        enabled: true
      }
    };

    setInstances([...instances, newInst]);
    setSnapshotSchedules(prev => ({
      ...prev,
      [newInst.id]: {
        enabled: false,
        interval: "daily",
        customCron: "0 0 * * *",
        lastRun: "Never",
        nextRun: "Not Scheduled"
      }
    }));
    setSelectedVps(newInst);
    setVpsName("");
    setVpsProject("");
    setVpsTags("");
  };

  const handleAction = (id: string, action: "start" | "stop" | "reboot") => {
    const nextStatus = action === "start" ? "running" : action === "stop" ? "stopped" : "rebooting";
    setInstances(instances.map(inst => {
      if (inst.id === id) {
        return { ...inst, status: nextStatus };
      }
      return inst;
    }));

    if (selectedVps?.id === id) {
      setSelectedVps({ ...selectedVps, status: nextStatus });
    }

    let actMsg = `[Action Initiated] Target command ${action.toUpperCase()} sent to Hypervisor Node for ${id}`;
    if (action === "reboot") {
      setTimeout(() => {
        setInstances(prev => prev.map(inst => inst.id === id ? { ...inst, status: "running" } : inst));
        if (selectedVps?.id === id) {
          setSelectedVps(prev => prev ? { ...prev, status: "running" } : null);
        }
      }, 3000);
    }
  };

  const addFirewallRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVps) return;

    const updated = {
      ...selectedVps,
      firewalls: [
        ...selectedVps.firewalls,
        { port: fwPort, protocol: fwProtocol, allowed: fwSource }
      ]
    };

    setInstances(instances.map(inst => inst.id === selectedVps.id ? updated : inst));
    setSelectedVps(updated);
    setFwPort(8080);
  };

  const deleteFirewallRule = (port: number) => {
    if (!selectedVps) return;
    const updated = {
      ...selectedVps,
      firewalls: selectedVps.firewalls.filter(fw => fw.port !== port)
    };
    setInstances(instances.map(inst => inst.id === selectedVps.id ? updated : inst));
    setSelectedVps(updated);
  };

  const triggerBackup = () => {
    if (!selectedVps) return;
    const dateFormatted = new Date().toISOString().replace("T", " ").substr(0, 16) + " UTC";
    const updated = {
      ...selectedVps,
      backups: [
        { date: dateFormatted, size: "3.8 GB", status: "success" },
        ...selectedVps.backups
      ]
    };
    setInstances(instances.map(inst => inst.id === selectedVps.id ? updated : inst));
    setSelectedVps(updated);
  };

  const downloadHistoricalReport = (format: "json" | "csv") => {
    if (!selectedVps) return;

    const activityLogs = [
      { timestamp: "2026-05-22 13:45:12 UTC", event: "SYSTEM_BOOT_SUCCESS", details: "Node initialized successfully after security patch cycle" },
      { timestamp: "2026-05-22 10:20:41 UTC", event: "PORT_FILTER_SYNC", details: "Firewall rules rebuilt. 3 active paths secured" },
      { timestamp: "2026-05-21 21:05:00 UTC", event: "CPU_SPIKE_WARNING", details: "CPU at 91.2% in container. Alarm dispatched to alerts email." },
      { timestamp: "2026-05-21 02:00:15 UTC", event: "BACKUP_SNAPSHOT_COMPILED", details: "Automated snapshot backup created. Size: 4.2 GB" },
      { timestamp: "2026-05-19 15:30:29 UTC", event: "SSH_KEY_GENERATED", details: "User initiated Ed25519 cryptographic token pair download" },
      { timestamp: "2026-05-14 02:00:11 UTC", event: "BACKUP_SNAPSHOT_COMPILED", details: "Automated snapshot backup created. Size: 4.1 GB" }
    ];

    const scheduler = snapshotSchedules[selectedVps.id] || { enabled: false, interval: "daily", customCron: "0 0 * * *" };

    if (format === "json") {
      const data = {
        server: {
          id: selectedVps.id,
          name: selectedVps.name,
          ip: selectedVps.ip,
          os: selectedVps.os,
          region: selectedVps.region,
          specs: selectedVps.specs,
          project: selectedVps.project,
          tags: selectedVps.tags,
          alerts: selectedVps.alerts
        },
        snapshotSchedule: scheduler,
        backups: selectedVps.backups,
        activityLogs: activityLogs
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vps_report_${selectedVps.name}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      let csvContent = "";
      csvContent += "=== SERVER METADATA ===\n";
      csvContent += "Field,Value\n";
      csvContent += `ID,${selectedVps.id}\n`;
      csvContent += `Name,${selectedVps.name}\n`;
      csvContent += `IP Address,${selectedVps.ip}\n`;
      csvContent += `OS Platform,${selectedVps.os}\n`;
      csvContent += `Region,${selectedVps.region}\n`;
      csvContent += `vCPU Cores,${selectedVps.specs.vcpu}\n`;
      csvContent += `RAM Memory,${selectedVps.specs.ram} GB\n`;
      csvContent += `Storage Disk,${selectedVps.specs.storage} GB\n`;
      csvContent += `Backup Schedule,${scheduler.enabled ? `Enabled (${scheduler.interval} / ${scheduler.customCron})` : "Disabled"}\n\n`;

      csvContent += "=== SNAPSHOT BACKUPS REGISTRY ===\n";
      csvContent += "Backup Date,Size,Status\n";
      selectedVps.backups.forEach(b => {
        csvContent += `"${b.date}","${b.size}","${b.status}"\n`;
      });
      csvContent += "\n";

      csvContent += "=== SYSTEM ACTIVITY LOGS ===\n";
      csvContent += "Timestamp,Event,Details\n";
      activityLogs.forEach(l => {
        csvContent += `"${l.timestamp}","${l.event}","${l.details}"\n`;
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vps_report_${selectedVps.name}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }

    setTerminalHistory(prev => [
      ...prev,
      `[REPORTS] Generated ${format.toUpperCase()} diagnostic snapshot report download for ${selectedVps.name}.`,
      `[REPORTS] active config metadata and kernel activity logs.`
    ]);
  };

  const downloadTelemetryReport = (format: "json" | "csv") => {
    if (!selectedVps) return;
    
    // Sort by timestamp asc
    const dataPoints = [...telemetryHistoryLog].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (format === "json") {
      const dataStr = JSON.stringify({
        server: {
          id: selectedVps.id,
          name: selectedVps.name,
          ip: selectedVps.ip,
          region: selectedVps.region
        },
        exportTime: new Date().toISOString(),
        telemetryPointsCount: dataPoints.length,
        telemetryData: dataPoints
      }, null, 2);
      
      const blob = new Blob([dataStr], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedVps.name}_diagnostics_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      let csvContent = "Timestamp,CPU_Usage_Pct,RAM_Usage_Pct,Disk_Read_MBs,Disk_Write_MBs\n";
      dataPoints.forEach((p) => {
        csvContent += `${p.timestamp},${p.cpu},${p.ram},${p.diskRead},${p.diskWrite}\n`;
      });
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedVps.name}_diagnostics_${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }

    setTerminalHistory(prev => [
      ...prev,
      `[MONITOR] 📊 Exported 30-minute high-fidelity ${format.toUpperCase()} telemetry log for ${selectedVps.name}.`
    ]);
  };

  const handleQuickAction = (action: "cache" | "services" | "temp") => {
    setIsProcessingAction(action);
    
    let termMsg = "";
    let logsUpdate = "";
    if (action === "cache") {
      termMsg = `[HW-DIAG] $ sync; echo 3 > /proc/sys/vm/drop_caches`;
      logsUpdate = "Cache flushed. Reclaimed ~1.2 GB of inactive kernel page caches.";
    } else if (action === "services") {
      termMsg = `[HW-DIAG] $ systemctl restart nebula-hypervisor.service`;
      logsUpdate = "Hypervisor micro-services restarted successfully. Active connections synchronized.";
    } else {
      termMsg = `[HW-DIAG] $ rm -rf /tmp/* /var/tmp/*`;
      logsUpdate = "Temporary system storage tables purged. Cleared 674 MB of ephemeral logs.";
    }

    setTerminalHistory(prev => [
      ...prev,
      termMsg,
      `[HW-DIAG] Active Node: "${selectedVps?.name}" | Initiating operation...`,
      `[HW-DIAG] SUCCESS: ${logsUpdate}`
    ]);

    setDiagnosticsLog(`[Action: ${action.toUpperCase()}] Running task...`);

    setTimeout(() => {
      setIsProcessingAction(null);
      setDiagnosticsLog(`SUCCESS: ${logsUpdate}`);
      
      if (action === "services") {
        setCpuUsage(prev => Math.min(95, prev + 15));
        setRamUsage(prev => Math.max(10, prev - 8));
      } else if (action === "cache") {
        setCpuUsage(prev => Math.min(95, prev + 5));
        setRamUsage(prev => Math.max(10, prev - 15));
      } else if (action === "temp") {
        setCpuUsage(prev => Math.min(95, prev + 3));
      }
    }, 1200);
  };

  const updateSnapshotSchedule = (interval: "hourly" | "daily" | "weekly" | "custom", enabled: boolean, customCron?: string) => {
    if (!selectedVps) return;
    
    let cron = customCron || "0 0 * * *";
    if (interval === "hourly") cron = "0 * * * *";
    else if (interval === "daily") cron = "0 0 * * *";
    else if (interval === "weekly") cron = "0 0 * * 0";

    const lastRunFormatted = new Date().toISOString().replace("T", " ").substr(0, 16) + " UTC";
    const nextRunDate = new Date();
    if (interval === "hourly") nextRunDate.setHours(nextRunDate.getHours() + 1);
    else if (interval === "daily") nextRunDate.setDate(nextRunDate.getDate() + 1);
    else if (interval === "weekly") nextRunDate.setDate(nextRunDate.getDate() + 7);
    else nextRunDate.setHours(nextRunDate.getHours() + 12);

    const nextRunFormatted = nextRunDate.toISOString().replace("T", " ").substr(0, 16) + " UTC";

    setSnapshotSchedules(prev => ({
      ...prev,
      [selectedVps.id]: {
        enabled,
        interval,
        customCron: cron,
        lastRun: enabled ? lastRunFormatted : "Never",
        nextRun: enabled ? nextRunFormatted : "Not Scheduled"
      }
    }));

    setTerminalHistory(prev => [
      ...prev,
      `[SCHEDULER] Updated Snapshot policy on server ${selectedVps.id}: ${enabled ? `ENABLED (${interval.toUpperCase()} cron: ${cron})` : "DISABLED"}.`,
      enabled ? `[SCHEDULER] Next automatic synchronization sequence set for: ${nextRunFormatted}` : `[SCHEDULER] Automatic backups paused.`
    ]);
  };

  const createCluster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clusterName) return;

    const newCluster: LoadBalancer = {
      id: `lb-${Math.random().toString(36).substr(2, 6)}`,
      name: clusterName.toLowerCase().replace(/\s+/g, "-"),
      algorithm: clusterAlgo,
      targetPort: clusterPort,
      ip: `104.244.18.${Math.floor(Math.random() * 200) + 50}`,
      nodeIds: [],
      status: "active",
      healthCheckPath: clusterHealthPath.trim() || "/healthz",
      throughput: "0 KB/s",
      activeConn: 0
    };

    setClusters([...clusters, newCluster]);
    setSelectedClusterId(newCluster.id);
    setClusterName("");
  };

  const deleteCluster = (id: string) => {
    setClusters(clusters.filter(c => c.id !== id));
    if (selectedClusterId === id) {
      const remaining = clusters.filter(c => c.id !== id);
      if (remaining.length > 0) setSelectedClusterId(remaining[0].id);
    }
  };

  const toggleNodeInCluster = (clusterId: string, nodeId: string) => {
    setClusters(clusters.map(c => {
      if (c.id === clusterId) {
        const alreadyAssigned = c.nodeIds.includes(nodeId);
        const nextNodeIds = alreadyAssigned
          ? c.nodeIds.filter(id => id !== nodeId)
          : [...c.nodeIds, nodeId];
        
        return {
          ...c,
          nodeIds: nextNodeIds,
          activeConn: nextNodeIds.length * (Math.floor(Math.random() * 50) + 30),
          throughput: nextNodeIds.length > 0 ? `${(nextNodeIds.length * 1.5 + Math.random()).toFixed(1)} MB/s` : "0 KB/s"
        };
      }
      return c;
    }));
  };

  const updateClusterAlgorithm = (clusterId: string, algo: LoadBalancer["algorithm"]) => {
    setClusters(clusters.map(c => c.id === clusterId ? { ...c, algorithm: algo } : c));
  };

  const renderInstanceCard = (v: VPSInstance) => {
    return (
      <button
        key={v.id}
        onClick={() => setSelectedVps(v)}
        className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col relative overflow-hidden ${
          selectedVps?.id === v.id
            ? "bg-slate-800/60 border-indigo-500/50"
            : "bg-slate-950/50 border-slate-800 hover:bg-slate-900/40 hover:border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-sm tracking-tight text-slate-200 flex items-center gap-1.5 font-mono truncate max-w-[200px]">
            {v.name}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-indigo-300 border border-slate-800 uppercase font-mono">{v.os}</span>
          </span>
          {v.status === "running" ? (
            <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              RUNNING
            </span>
          ) : v.status === "stopped" ? (
            <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 bg-rose-950/40 border border-rose-800 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span>
              OFFLINE
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-950/30 border border-amber-800 px-2 py-0.5 rounded-full animate-pulse">
              REBOOTING
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-1">
          <span>{v.region}</span>
          <span>•</span>
          <span>{v.ip}</span>
        </div>

        {/* Project & Tags metadata badge list */}
        {(v.project || (v.tags && v.tags.length > 0)) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1.5 border-t border-slate-950/40">
            {v.project && (
              <span className="text-[9px] font-mono font-bold uppercase bg-indigo-950/45 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-900/30">
                📁 {v.project}
              </span>
            )}
            {v.tags?.map((t, idx) => (
              <span key={idx} className="text-[9px] font-mono font-bold bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-850">
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="text-[11px] text-slate-400 mt-2 font-mono bg-slate-950/70 p-1 rounded px-2 flex justify-between">
          <span>{v.specs.vcpu} vCPU / {v.specs.ram}GB Memory</span>
          <span className="text-indigo-400">{v.specs.storage}GB NVMe</span>
        </div>
      </button>
    );
  };

  // Derived filtered instances list
  const filteredInstances = instances.filter((v) => {
    const matchesProject = selectedProjectFilter === "all" || v.project === selectedProjectFilter;
    const matchesTag = selectedTagFilter === "all" || v.tags?.some(t => t.trim().toLowerCase() === selectedTagFilter.toLowerCase());
    const matchesSearch = searchQuery === "" || v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.ip.includes(searchQuery);
    return matchesProject && matchesTag && matchesSearch;
  });

  const allProjects = Array.from(new Set(instances.map(v => v.project).filter(Boolean))) as string[];
  const allTags = Array.from(new Set(instances.flatMap(v => v.tags || []).map(t => t.trim().toLowerCase()).filter(Boolean))) as string[];

  const renderGroupedInstances = () => {
    if (filteredInstances.length === 0) {
      return (
        <div className="text-center py-10 text-slate-500 text-xs font-mono">
          No matches found.
        </div>
      );
    }

    if (groupBy === "none") {
      return (
        <div className="space-y-3">
          {filteredInstances.map((v) => renderInstanceCard(v))}
        </div>
      );
    }

    if (groupBy === "project") {
      const projectsMap: { [key: string]: VPSInstance[] } = {};
      filteredInstances.forEach((v) => {
        const proj = v.project?.trim() || "Unassigned Projects";
        if (!projectsMap[proj]) projectsMap[proj] = [];
        projectsMap[proj].push(v);
      });

      return (
        <div className="space-y-4">
          {Object.entries(projectsMap).map(([project, list]) => {
            const isCollapsed = collapsedProjects[project] ?? false;
            return (
              <div key={project} className="space-y-2 border-l-2 border-indigo-500/25 pl-3 pt-1">
                <button
                  type="button"
                  onClick={() => toggleProjectCollapse(project)}
                  className="flex items-center justify-between w-full text-left font-mono text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:bg-indigo-950/40 rounded px-1.5 py-1 -ml-1.5 transition cursor-pointer"
                  title="Click to toggle group visibility"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                    <span>{project} ({list.length})</span>
                  </div>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-400/70" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-indigo-400/70" />
                  )}
                </button>
                {!isCollapsed && (
                  <div className="space-y-2.5 pt-1">
                    {list.map((v) => renderInstanceCard(v))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (groupBy === "tag") {
      const tagsMap: { [key: string]: VPSInstance[] } = {};
      let hasUntagged = false;
      const untaggedList: VPSInstance[] = [];

      filteredInstances.forEach((v) => {
        if (v.tags && v.tags.length > 0) {
          v.tags.forEach((t) => {
            const cleanTag = t.trim().toLowerCase();
            if (selectedTagFilter !== "all" && cleanTag !== selectedTagFilter.toLowerCase()) return;
            if (!tagsMap[cleanTag]) tagsMap[cleanTag] = [];
            tagsMap[cleanTag].push(v);
          });
        } else {
          if (selectedTagFilter === "all") {
            hasUntagged = true;
            untaggedList.push(v);
          }
        }
      });

      return (
        <div className="space-y-4">
          {Object.entries(tagsMap).map(([tag, list]) => (
            <div key={tag} className="space-y-2 border-l-2 border-cyan-500/25 pl-3 pt-1">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">#{tag} ({list.length})</span>
              </div>
              <div className="space-y-2.5">
                {list.map((v) => renderInstanceCard(v))}
              </div>
            </div>
          ))}
          {hasUntagged && untaggedList.length > 0 && (
            <div key="untagged" className="space-y-2 border-l-2 border-slate-600 pl-3 pt-1">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Untagged ({untaggedList.length})</span>
              </div>
              <div className="space-y-2.5">
                {untaggedList.map((v) => renderInstanceCard(v))}
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  const renderClustersView = () => {
    const activeCluster = clusters.find(c => c.id === selectedClusterId) || clusters[0];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="clusters_view_panel">
        {/* Left column: Cluster List & Provision Cluster */}
        <div className="lg:col-span-4 space-y-6">
          {/* Provision cluster card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <h2 className="text-lg font-bold font-sans tracking-tight mb-4 flex items-center gap-2 text-indigo-400">
              <Layers className="w-5 h-5 animate-pulse" /> Deploy Load Balancer
            </h2>
            <p className="text-xs text-slate-400 mb-6 font-sans">
              Proxy and distribute high throughput traffic dynamically across selected VPS nodes.
            </p>

            <form onSubmit={createCluster} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">Cluster Identifier Name</label>
                <input
                  type="text"
                  placeholder="e.g. stage-ingress-lb"
                  value={clusterName || ""}
                  onChange={(e) => setClusterName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-200 transition font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">LB Scheduler</label>
                  <select
                    value={clusterAlgo}
                    onChange={(e) => setClusterAlgo(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-400 font-mono text-indigo-300 align-middle"
                  >
                    <option value="round-robin">Round Robin</option>
                    <option value="least-connections">Least Conn</option>
                    <option value="ip-hash font-bold">Source IP Hash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">Target Port</label>
                  <select
                    value={clusterPort}
                    onChange={(e) => setClusterPort(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-400 font-mono text-indigo-300 align-middle"
                  >
                    <option value="80">HTTP (80)</option>
                    <option value="443">HTTPS (443)</option>
                    <option value="8080">Proxy (8080)</option>
                    <option value="3000">NodeApp (3000)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">HTTP Health Endpoint</label>
                <input
                  type="text"
                  placeholder="e.g. /health"
                  value={clusterHealthPath || ""}
                  onChange={(e) => setClusterHealthPath(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-xs outline-none focus:border-indigo-400 text-slate-200 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white py-2.5 rounded-lg text-xs font-semibold font-mono tracking-wider transition uppercase flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" /> Deploy Cluster Ingress
              </button>
            </form>
          </div>

          {/* Active clusters selection directory */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl space-y-4">
            <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-slate-400 border-b border-slate-800/60 pb-2">Active LB Pools</h3>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {clusters.map((cluster) => (
                <div
                  key={cluster.id}
                  onClick={() => setSelectedClusterId(cluster.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col relative overflow-hidden cursor-pointer ${
                    selectedClusterId === cluster.id
                      ? "bg-slate-00/60 bg-slate-800/80 border-indigo-500/50"
                      : "bg-slate-950/50 border-slate-800 hover:bg-slate-900/40 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs tracking-tight text-slate-200 flex items-center gap-1.5 font-mono truncate max-w-[200px]">
                      🌐 {cluster.name}
                    </span>
                    <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/30 border border-indigo-900/40 px-2 py-0.5 rounded uppercase font-bold">
                      {cluster.algorithm}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 pt-1.5 border-t border-slate-950/45">
                    <span>IP: {cluster.ip}</span>
                    <span className="text-slate-400">{cluster.nodeIds.length} Nodes</span>
                  </div>
                  
                  {/* Delete Cluster Button */}
                  <div className="flex justify-end gap-2 mt-2 pt-1.5 border-t border-slate-900">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteCluster(cluster.id); }}
                      className="text-slate-600 hover:text-rose-400 text-[10px] font-mono flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3 h-3" /> Decommission
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Details and interactive topology visualizer */}
        <div className="lg:col-span-8 space-y-6">
          {activeCluster ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl relative">
              
              {/* Header metrics */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-indigo-500/30 text-indigo-400">
                    <Globe className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-mono">{activeCluster.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">Static Virt IP: <span className="text-indigo-400 font-bold">{activeCluster.ip}:{activeCluster.targetPort}</span> | Algorithm: <span className="text-indigo-300 font-bold uppercase">{activeCluster.algorithm}</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-right">
                  <div className="bg-slate-950 p-2 border border-slate-850 rounded-lg min-w-[120px]">
                    <span className="block text-[9px] font-mono text-slate-500 uppercase">Throughput</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">{activeCluster.nodeIds.length > 0 ? activeCluster.throughput : "0 KB/s"}</span>
                  </div>
                  <div className="bg-slate-950 p-2 border border-slate-850 rounded-lg min-w-[120px]">
                    <span className="block text-[9px] font-mono text-slate-500 uppercase font-semibold">Connections</span>
                    <span className="text-xs font-mono font-bold text-indigo-300">{activeCluster.nodeIds.length > 0 ? activeCluster.activeConn : 0} Conn</span>
                  </div>
                </div>
              </div>

              {/* Dynamic algorithm settings */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono font-bold text-indigo-400 uppercase flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5" /> Balancer Algorithm Optimization</span>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5 font-semibold">Modify traffic propagation strategies instantly across the cluster pool.</p>
                </div>

                <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg gap-1 font-mono text-[10px]">
                  {(["round-robin", "least-connections", "ip-hash"] as const).map((algo) => (
                    <button
                      key={algo}
                      type="button"
                      onClick={() => updateClusterAlgorithm(activeCluster.id, algo)}
                      className={`px-2.5 py-1.5 cursor-pointer transition rounded font-semibold capitalize ${
                        activeCluster.algorithm === algo
                          ? "bg-indigo-600 text-white font-bold"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {algo.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* CLUSTER TOPOLOGY MAP GRAPH (STUNNING GRAPHICAL DRAWING) */}
              <div className="mt-6 border border-slate-850/60 rounded-xl bg-slate-950/60 p-5">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-4">Ingress Inbound Router Topology</span>
                
                <div className="grid grid-cols-12 gap-3 items-center">
                  {/* Traffic Origin */}
                  <div className="col-span-3 flex flex-col items-center justify-center p-3 bg-slate-950 border border-slate-850 rounded-xl text-center">
                    <Wifi className="w-5 h-5 text-indigo-400 animate-bounce mb-1.5" />
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-200">Public Ingress</span>
                    <span className="text-[8px] font-mono text-slate-500">Request Gate</span>
                  </div>

                  {/* Flow Arrow block */}
                  <div className="col-span-1 flex justify-center text-indigo-500/80 font-bold text-lg animate-pulse font-mono">
                    ➔
                  </div>

                  {/* Load Balancer Core */}
                  <div className="col-span-4 flex flex-col items-center justify-center p-4 bg-indigo-950/30 border border-indigo-900/50 rounded-xl relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-500/25 rounded-full blur"></div>
                    <Globe className="w-7 h-7 text-indigo-300 mb-1.5" />
                    <span className="text-[10px] font-mono font-bold text-indigo-200 truncate max-w-full">{activeCluster.name}</span>
                    <span className="text-[9px] font-mono text-indigo-400 mt-0.5">{activeCluster.ip}</span>
                    <span className="text-[8px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-900 mt-2 uppercase font-bold text-indigo-300">{activeCluster.algorithm}</span>
                  </div>

                  {/* Flow Arrow block */}
                  <div className="col-span-1 flex justify-center text-indigo-500/80 font-bold text-lg animate-pulse font-mono">
                    ➔
                  </div>

                  {/* Realtime nodes attached */}
                  <div className="col-span-3 space-y-2 bg-slate-950 p-2.5 rounded-xl border border-slate-850 h-[155px] overflow-y-auto">
                    {instances.filter(v => activeCluster.nodeIds.includes(v.id)).length === 0 ? (
                      <div className="text-[9px] font-mono text-slate-600 text-center py-10 leading-snug">No active pools linked.</div>
                    ) : (
                      instances.filter(v => activeCluster.nodeIds.includes(v.id)).map(v => (
                        <div key={v.id} className="p-1 px-1.5 border border-emerald-950/40 bg-emerald-950/20 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                            <span className="text-[9px] font-mono text-slate-200 truncate max-w-[55px] font-bold">{v.name}</span>
                          </div>
                          <span className="text-[8px] font-mono text-emerald-400 font-bold">{v.ip}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* NODE POOL SUBSYSTEM ASSIGNMENT FORM */}
              <div className="mt-6 space-y-3">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest block">Server Pool Nodes Assignment</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {instances.map(inst => {
                    const isAssigned = activeCluster.nodeIds.includes(inst.id);
                    return (
                      <div key={inst.id} className="bg-slate-950/60 p-3 border border-slate-850 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                            💻 {inst.name}
                            <span className="text-[8px] uppercase font-mono px-1 border border-slate-800 bg-slate-900 text-indigo-300 rounded font-semibold">{inst.os}</span>
                          </span>
                          <span className="block text-[9px] font-mono text-slate-500 mt-0.5">{inst.region} • {inst.ip}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleNodeInCluster(activeCluster.id, inst.id)}
                          className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase rounded border transition cursor-pointer ${
                            isAssigned
                              ? "bg-rose-950/40 border-rose-900/40 text-rose-300 hover:bg-rose-900/70"
                              : "bg-indigo-950/40 border-indigo-900/40 text-indigo-300 hover:bg-indigo-900/70"
                          }`}
                        >
                          {isAssigned ? "Exclude" : "Include"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center p-12 text-slate-500 font-mono text-xs">Provision a dynamic balancer cluster to start.</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans" id="vps_manager_root">
      {/* View Selector Tab */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/60 pb-5 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Server className="w-5.5 h-5.5 text-indigo-400" /> Nebula Hypervisor Hub
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">Automated Bare-metal Virtualization & Cluster Balancer Engine</p>
        </div>
        
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-850 gap-1 shadow-lg">
          <button
            type="button"
            onClick={() => setActiveView("nodes")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-mono font-bold uppercase rounded-lg tracking-wider transition-all cursor-pointer ${
              activeView === "nodes"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> Compute Nodes
          </button>
          <button
            type="button"
            onClick={() => setActiveView("clusters")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-mono font-bold uppercase rounded-lg tracking-wider transition-all cursor-pointer ${
              activeView === "clusters"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Load Balancers
          </button>
        </div>
      </div>

      {activeView === "clusters" ? (
        renderClustersView()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Create and Directory */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <h2 className="text-xl font-bold font-sans tracking-tight mb-4 flex items-center gap-2 text-indigo-400">
            <Server className="w-5 h-5 text-indigo-400" />
            Provision VPS Node
          </h2>
          <p className="text-sm text-slate-400 mb-6 font-sans">
            Scale dedicated compute nodes on elite bare-metal virtualizers instantly.
          </p>

          <form onSubmit={createVps} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">Server Alias</label>
              <input
                type="text"
                placeholder="e.g. stage-cache-redis"
                value={vpsName}
                onChange={(e) => setVpsName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">OS Platform</label>
                <select
                  value={vpsOs}
                  onChange={(e) => setVpsOs(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-400 font-mono text-indigo-300"
                >
                  <option value="ubuntu">Ubuntu 22.04 LTS</option>
                  <option value="debian">Debian 12 Tech</option>
                  <option value="alpine">Alpine Core</option>
                  <option value="rocky">Rocky Linux Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">Location Host</label>
                <select
                  value={vpsRegion}
                  onChange={(e) => setVpsRegion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-400 font-mono text-indigo-300"
                >
                  <option value="US East (N. Virginia)">US East 1</option>
                  <option value="EU Central (Frankfurt)">EU Central 2</option>
                  <option value="AP South (Mumbai)">AP South 1</option>
                  <option value="SA East (São Paulo)">SA East 1</option>
                </select>
              </div>
            </div>

            {/* Task 4: Organizing with Project name and tag descriptors */}
            <div className="grid grid-cols-2 gap-3 pb-1">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Lambda-Backend"
                  value={vpsProject}
                  onChange={(e) => setVpsProject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-400 font-mono text-indigo-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. staging, cache, static"
                  value={vpsTags}
                  onChange={(e) => setVpsTags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-400 font-mono text-indigo-300"
                />
              </div>
            </div>

            {/* Custom Sliders representing dynamic server configurations */}
            <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-slate-400">Server vCPU Cores:</span>
                  <span className="text-indigo-400 font-bold">{vCpu} Cores</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="16"
                  value={vCpu}
                  onChange={(e) => setVCpu(parseInt(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer h-1 bg-slate-800 rounded"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-slate-400">Allocation Memory:</span>
                  <span className="text-indigo-400 font-bold">{ram} GB DDR5</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="128"
                  step="2"
                  value={ram}
                  onChange={(e) => setRam(parseInt(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer h-1 bg-slate-800 rounded"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-slate-400">SSD Storage Block:</span>
                  <span className="text-indigo-400 font-bold">{storage} GB NVMe</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={storage}
                  onChange={(e) => setStorage(parseInt(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer h-1 bg-slate-800 rounded"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] hover:shadow-indigo-900/30 text-white py-3 rounded-lg text-sm font-semibold transition shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Server className="w-4 h-4" />
              Spin Up Hypervisor Instance
            </button>
          </form>
        </div>

        {/* Inst Directory with Organization Groups */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl space-y-4" id="services_directory">
          <div className="flex flex-col gap-3 pb-2 border-b border-slate-800/60">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-slate-400">VPS Pools</h3>
              
              {/* Dynamic grouping tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850">
                {(["none", "project", "tag"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setGroupBy(mode)}
                    className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded capitalize tracking-tight transition ${
                      groupBy === mode
                        ? "bg-indigo-600 text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Filter Inputs */}
            <div className="space-y-2">
              <input
                type="text"
                placeholder="🔍 Search name or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400 text-slate-350 font-mono"
              />
              {/* Group by Project Switch */}
              <div className="flex items-center justify-between bg-slate-950/40 border border-slate-850/60 rounded-lg p-2 font-sans">
                <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5 font-sans">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  Group by Project
                </span>
                <button
                  type="button"
                  onClick={() => setGroupBy(groupBy === "project" ? "none" : "project")}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    groupBy === "project" ? "bg-indigo-600" : "bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-100 shadow ring-0 transition duration-200 ease-in-out ${
                      groupBy === "project" ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div>
                  <label className="block text-[8px] text-slate-500 uppercase font-semibold mb-1">Project</label>
                  <select
                    value={selectedProjectFilter}
                    onChange={(e) => setSelectedProjectFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded px-1.5 py-1 text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="all">📁 All Projects</option>
                    {allProjects.map((proj) => (
                      <option key={proj} value={proj}>{proj}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] text-slate-500 uppercase font-semibold mb-1">Tag Label</label>
                  <select
                    value={selectedTagFilter}
                    onChange={(e) => setSelectedTagFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded px-1.5 py-1 text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="all">🏷️ All Tags</option>
                    {allTags.map((tag) => (
                      <option key={tag} value={tag}>#{tag}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-[350px] overflow-y-auto pr-1">
            {renderGroupedInstances()}
          </div>
        </div>
      </div>

      {/* Main interactive segment */}
      <div className="lg:col-span-8 space-y-6">
        {selectedVps && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl relative font-sans">
            {testAlertToast && (
              <div className="absolute top-24 left-6 right-6 bg-slate-950/95 border border-pink-500/40 rounded-xl p-3.5 shadow-2xl flex items-center justify-between gap-3 animate-pulse z-50">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-pink-400 block tracking-widest uppercase">SMTP ALERT DISPATCHED</span>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Alarm thresholds exceeded! Notification dispatched to <span className="text-indigo-300 font-bold">{testAlertToast.email}</span>
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest bg-pink-900/30 text-pink-300 px-2 py-0.5 rounded border border-pink-900/40">
                  Transferred
                </span>
              </div>
            )}
            {/* Top row actions */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800 hover:border-slate-700 transition duration-300">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-indigo-500/30 text-indigo-400">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-sans text-white">{selectedVps.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">IP address: {selectedVps.ip} | OS: {selectedVps.os}</p>
                </div>
              </div>

              {/* Server Controllers */}
              <div className="flex items-center gap-2">
                {selectedVps.status !== "running" && (
                  <button
                    onClick={() => handleAction(selectedVps.id, "start")}
                    className="p-2.5 bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-emerald-400" />
                    Start Node
                  </button>
                )}
                {selectedVps.status === "running" && (
                  <button
                    onClick={() => handleAction(selectedVps.id, "stop")}
                    className="p-2.5 bg-rose-950/50 hover:bg-rose-900 border border-rose-850 text-rose-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-rose-400" />
                    Shutdown
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleGenerateSSHKey}
                  className="p-2.5 bg-indigo-950/60 hover:bg-slate-900 border border-indigo-900/55 text-indigo-300 hover:text-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer font-sans"
                  title="Generate & download secure cryptographic key pair for this VPS"
                >
                  <Key className="w-3.5 h-3.5" />
                  Generate SSH Keys
                </button>
                
                {/* Task 5: Download Report controls */}
                <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
                  <button
                    type="button"
                    onClick={() => downloadHistoricalReport("json")}
                    className="px-2.5 py-2 text-slate-300 hover:text-cyan-400 text-xs font-semibold flex items-center gap-1 cursor-pointer font-mono"
                    title="Export system activity audit and backups log report in JSON format"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-450 text-cyan-400 animate-pulse" />
                    <span>Report JSON</span>
                  </button>
                  <div className="h-4 w-[1px] bg-slate-800"></div>
                  <button
                    type="button"
                    onClick={() => downloadHistoricalReport("csv")}
                    className="px-2.5 py-2 text-slate-300 hover:text-cyan-400 text-xs font-semibold flex items-center gap-1 cursor-pointer font-mono"
                    title="Export system activity audit and backups log report in CSV format"
                  >
                    <span>CSV</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleAction(selectedVps.id, "reboot")}
                  disabled={selectedVps.status === "rebooting"}
                  className="p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 font-sans"
                >
                  <RotateCw className={`w-4 h-4 ${selectedVps.status === "rebooting" ? "animate-spin text-amber-400" : ""}`} />
                  Reboot Virtualizer
                </button>
              </div>
            </div>

            {/* Detail Tabs strip: Terminal Shell vs Hardware Diagnostics */}
            <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-850 mt-6 gap-1 shadow">
              <button
                type="button"
                onClick={() => setActiveDetailTab("terminal")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-bold uppercase rounded-lg tracking-wider transition-all cursor-pointer ${
                  activeDetailTab === "terminal"
                    ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" /> SSH Terminal Shell
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab("diagnostics")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-bold uppercase rounded-lg tracking-wider transition-all cursor-pointer ${
                  activeDetailTab === "diagnostics"
                    ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                }`}
              >
                <Activity className="w-3.5 h-3.5 animate-pulse" /> Hardware Diagnostics
              </button>
            </div>

            {/* Sub-panels layout: Console / Diagnostics + Firewall & Alerts */}
            <div className={`grid grid-cols-1 ${activeDetailTab === "diagnostics" && isDiagnosticsMaximized ? "grid-cols-1" : "md:grid-cols-2"} gap-6 mt-4`}>
              
              {activeDetailTab === "terminal" ? (
                /* Retro Terminal Console Emulator */
                <div className="bg-slate-950 rounded-xl border border-slate-850 overflow-hidden flex flex-col h-[410px]" id="ssh_console_container">
                  <div className="bg-slate-900 border-b border-slate-850 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-mono font-bold text-slate-300">root@{selectedVps.name}</span>
                    </div>

                    {/* Font and Theme Customizers */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-850 text-[10px]">
                        <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Font</span>
                        <select
                          value={terminalFontSize}
                          onChange={(e) => setTerminalFontSize(e.target.value as any)}
                          className="bg-transparent text-[10px] font-mono outline-none text-slate-300 border-none p-0 cursor-pointer align-middle"
                        >
                          <option value="xs">XS</option>
                          <option value="sm">SM</option>
                          <option value="md">MD</option>
                          <option value="lg">LG</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-850 text-[10px]">
                        <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Theme</span>
                        <select
                          value={terminalTheme}
                          onChange={(e) => setTerminalTheme(e.target.value as any)}
                          className="bg-transparent text-[10px] font-mono outline-none text-slate-300 border-none p-0 cursor-pointer align-middle"
                        >
                          <option value="emerald">Emerald</option>
                          <option value="amber">Amber</option>
                          <option value="amethyst">Amethyst</option>
                          <option value="slate">Slate</option>
                          <option value="crimson">Crimson</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className={`flex-1 p-4 font-mono overflow-y-auto space-y-2 ${
                    terminalFontSize === "xs" ? "text-xs" : terminalFontSize === "sm" ? "text-sm" : terminalFontSize === "md" ? "text-base" : "text-lg"
                  } ${
                    terminalTheme === "amethyst" ? "text-purple-400 bg-slate-955" :
                    terminalTheme === "amber" ? "text-amber-400 bg-slate-955" :
                    terminalTheme === "slate" ? "text-slate-100 bg-slate-955" :
                    terminalTheme === "crimson" ? "text-rose-400 bg-slate-955" : "text-emerald-400 bg-slate-955"
                  }`}>
                    {terminalHistory.map((hist, idx) => (
                      <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                        {hist}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleCommandSubmit} className="bg-slate-900 border-t border-slate-850 p-2 flex items-center gap-2">
                    <span className="text-slate-500 font-mono text-xs pl-2">#</span>
                    <input
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type 'help' in shell..."
                      className={`flex-1 bg-transparent border-none focus:outline-none focus:ring-0 font-mono text-xs ${
                        terminalTheme === "amethyst" ? "text-purple-300" :
                        terminalTheme === "amber" ? "text-amber-300" :
                        terminalTheme === "slate" ? "text-slate-200" :
                        terminalTheme === "crimson" ? "text-rose-300" : "text-emerald-300"
                      }`}
                    />
                    <button type="submit" className="text-[10px] uppercase font-mono px-3 py-1 bg-slate-800 rounded border border-slate-700 hover:bg-slate-755 text-slate-300 cursor-pointer">
                      Exec
                    </button>
                  </form>
                </div>
              ) : (
                /* Task 5: Hardware Diagnostics Panel */
                <div 
                  className={`bg-slate-950 rounded-xl border p-5 flex flex-col transition-all duration-300 relative ${
                    isDiagnosticsMaximized ? "min-h-[500px]" : "min-h-[460px]"
                  } ${
                    selectedVps.alerts?.enabled && (cpuUsage > (selectedVps.alerts?.cpuThreshold ?? 85) || ramUsage > (selectedVps.alerts?.ramThreshold ?? 90))
                      ? "border-pink-500/80 shadow-[0_0_20px_rgba(244,63,94,0.25)] bg-slate-950/95"
                      : "border-slate-855"
                  }`}
                  id="diagnostics_panel"
                >
                  <div className="flex flex-col h-full justify-between gap-4">
                    <div>
                      {/* Diagnostic Panel Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-900 mb-4 gap-2 flex-wrap">
                        <span className="text-xs font-bold font-mono tracking-wider uppercase text-cyan-400 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" /> HW Metric Diagnoses
                        </span>
                        
                        <div className="flex items-center gap-2 flex-wrap text-sans">
                          {/* Live Refresh and Interval configuration */}
                          <div className="flex items-center bg-slate-900 border border-slate-800 rounded px-2 py-1 gap-2 text-[10px] font-mono">
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                              <input
                                type="checkbox"
                                checked={isLiveRefreshEnabled}
                                onChange={(e) => setIsLiveRefreshEnabled(e.target.checked)}
                                className="w-3 h-3 accent-cyan-500 cursor-pointer bg-slate-950 rounded border-slate-800"
                              />
                              <span>Auto-Refresh</span>
                            </label>
                            
                            {isLiveRefreshEnabled && (
                              <select
                                value={refreshFrequency}
                                onChange={(e) => setRefreshFrequency(parseInt(e.target.value))}
                                className="bg-transparent border-none text-[9px] text-cyan-400 font-bold outline-none cursor-pointer p-0"
                              >
                                <option value="1000">1s rate</option>
                                <option value="3000">3s rate</option>
                                <option value="5000">5s rate</option>
                              </select>
                            )}
                          </div>

                          {/* Export Diagnostics button */}
                          <div className="flex items-center bg-slate-905 bg-slate-900 border border-slate-800 rounded py-0.5 text-[10px] font-mono px-1">
                            <span className="text-[9px] text-slate-500 font-semibold px-2">Export Diagnostics:</span>
                            <button
                              type="button"
                              onClick={() => downloadTelemetryReport("json")}
                              className="px-2 py-0.5 hover:text-cyan-400 text-slate-300 transition cursor-pointer font-bold"
                              title="Export last 30 minutes to JSON"
                            >
                              JSON
                            </button>
                            <span className="text-slate-800">|</span>
                            <button
                              type="button"
                              onClick={() => downloadTelemetryReport("csv")}
                              className="px-2 py-0.5 hover:text-cyan-400 text-slate-300 transition cursor-pointer font-bold"
                              title="Export last 30 minutes to CSV"
                            >
                              CSV
                            </button>
                          </div>

                          {/* Maximize Toggle Button */}
                          <button
                            type="button"
                            onClick={() => setIsDiagnosticsMaximized(!isDiagnosticsMaximized)}
                            className="p-1 px-2.5 text-[9px] font-mono font-bold uppercase rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition flex items-center gap-1 cursor-pointer"
                            title={isDiagnosticsMaximized ? "Collaborate page split view" : "Maximize diagnostics view"}
                          >
                            {isDiagnosticsMaximized ? (
                              <>
                                <Minimize2 className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Minimize</span>
                              </>
                            ) : (
                              <>
                                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Maximize</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={openAlertModal}
                            className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-mono font-bold uppercase rounded bg-indigo-950/60 hover:bg-slate-900 border border-indigo-900/55 text-indigo-300 hover:text-white transition cursor-pointer"
                          >
                            <Sliders className="w-3 h-3" />
                            Configure Threshold Alerts
                          </button>
                        </div>
                      </div>
                    </div>
                                     {/* Body structure: dynamic list/split column grid layout */}
                    <div className={`grid gap-6 ${isDiagnosticsMaximized ? "grid-cols-1 md:grid-cols-12" : "grid-cols-1"}`}>
                      
                      {/* Left Section: Standard Guages (span 5/12 when maximized) */}
                      <div className={`${isDiagnosticsMaximized ? "md:col-span-5 space-y-4" : "space-y-4"}`}>
                        
                        {/* Breach visual warning banner inside panel */}
                        {selectedVps.alerts?.enabled && (cpuUsage > (selectedVps.alerts?.cpuThreshold ?? 85) || ramUsage > (selectedVps.alerts?.ramThreshold ?? 90)) && (
                          <div className="bg-pink-955/30 border border-pink-500/40 rounded-lg p-2.5 flex items-center gap-2 animate-pulse mb-3">
                            <ShieldAlert className="w-4 h-4 text-pink-500 animate-bounce" />
                            <div>
                              <div className="text-[10px] uppercase font-mono font-bold text-pink-400">🚨 EXCEEDED MASTER THRESHOLD</div>
                              <div className="text-[8px] font-mono text-slate-400">
                                {cpuUsage > (selectedVps.alerts?.cpuThreshold ?? 85) && `CPU utilization (${cpuUsage.toFixed(1)}%) exceeds active alarm trigger of ${selectedVps.alerts.cpuThreshold}%. `}
                                {ramUsage > (selectedVps.alerts?.ramThreshold ?? 90) && `RAM memory load (${ramUsage.toFixed(1)}%) exceeds active alarm trigger of ${selectedVps.alerts.ramThreshold}%.`}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-4">
                          {/* CPU Utilization */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-mono">
                              <span className="text-slate-400">⚡ CPU Utilization</span>
                              <span className={`font-bold ${cpuUsage > (selectedVps.alerts?.cpuThreshold ?? 80) ? "text-pink-400 font-extrabold animate-pulse" : "text-indigo-400"}`}>{cpuUsage.toFixed(1)}%</span>
                            </div>
                            <div className="relative w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-850">
                              <div 
                                className={`h-full transition-all duration-1000 ${
                                  cpuUsage > (selectedVps.alerts?.cpuThreshold ?? 80) ? "bg-pink-500 animate-pulse" : "bg-indigo-505"
                                }`} 
                                style={{ width: `${cpuUsage}%` }}
                              ></div>
                              {selectedVps.alerts?.enabled && (
                                <div 
                                  className="absolute top-0 bottom-0 w-[2px] bg-pink-400/85"
                                  style={{ left: `${selectedVps.alerts.cpuThreshold}%` }}
                                  title={`CPU Alert Threshold: ${selectedVps.alerts.cpuThreshold}%`}
                                ></div>
                              )}
                            </div>
                          </div>

                          {/* RAM Memory Utilization */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-mono">
                              <span className="text-slate-400">🧠 RAM Memory Utilization</span>
                              <span className={`font-bold ${ramUsage > (selectedVps.alerts?.ramThreshold ?? 80) ? "text-pink-400 font-extrabold animate-pulse" : "text-indigo-400"}`}>{ramUsage.toFixed(1)}%</span>
                            </div>
                            <div className="relative w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-850">
                              <div 
                                className={`h-full transition-all duration-1000 ${
                                  ramUsage > (selectedVps.alerts?.ramThreshold ?? 80) ? "bg-pink-500 animate-pulse" : "bg-indigo-505"
                                }`} 
                                style={{ width: `${ramUsage}%` }}
                              ></div>
                              {selectedVps.alerts?.enabled && (
                                <div 
                                  className="absolute top-0 bottom-0 w-[2px] bg-pink-400/85"
                                  style={{ left: `${selectedVps.alerts.ramThreshold}%` }}
                                  title={`RAM Alert Threshold: ${selectedVps.alerts.ramThreshold}%`}
                                ></div>
                              )}
                            </div>
                          </div>

                          {/* Disk Read Throughput */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-mono">
                              <span className="text-slate-400">💾 Disk Read Throughput</span>
                              <span className="text-emerald-400 font-bold">{diskRead.toFixed(1)} MB/s</span>
                            </div>
                            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850">
                              <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${Math.min((diskRead / 30) * 100, 100)}%` }}></div>
                            </div>
                          </div>

                          {/* Disk Write Throughput */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-mono">
                              <span className="text-slate-400">💾 Disk Write Throughput</span>
                              <span className="text-cyan-400 font-bold">{diskWrite.toFixed(1)} MB/s</span>
                            </div>
                            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850">
                              <div className="bg-cyan-500 h-full transition-all duration-1000" style={{ width: `${Math.min((diskWrite / 30) * 100, 100)}%` }}></div>
                            </div>
                          </div>

                          {/* RX Ingress Packets */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-mono">
                              <span className="text-slate-400">📥 Ingress (RX) Rate</span>
                              <span className="text-indigo-400 font-bold">{netRx.toFixed(1)} KB/s</span>
                            </div>
                            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850">
                              <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${Math.min((netRx / 500) * 100, 100)}%` }}></div>
                            </div>
                          </div>

                          {/* TX Egress Packets */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-mono">
                              <span className="text-slate-400">📤 Egress (TX) Rate</span>
                              <span className="text-pink-400 font-bold">{netTx.toFixed(1)} KB/s</span>
                            </div>
                            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-853">
                              <div className="bg-pink-500 h-full transition-all duration-1000" style={{ width: `${Math.min((netTx / 500) * 100, 100)}%` }}></div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions Panel */}
                        <div className="bg-slate-900/65 p-3.5 rounded-lg border border-slate-850 space-y-2.5">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Node Quick Diagnostic Actions</span>
                          <div className="flex flex-wrap gap-2 text-sans">
                            <button
                              type="button"
                              onClick={() => handleQuickAction("cache")}
                              disabled={isProcessingAction !== null}
                              className="flex-1 min-w-[95px] text-center px-2 py-1.5 text-[9px] font-mono font-bold uppercase rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-cyan-300 hover:text-white transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              {isProcessingAction === "cache" ? <RotateCw className="w-3 h-3 animate-spin text-cyan-400" /> : "🧼 Clear Cache"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAction("services")}
                              disabled={isProcessingAction !== null}
                              className="flex-1 min-w-[95px] text-center px-2 py-1.5 text-[9px] font-mono font-bold uppercase rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-indigo-300 hover:text-white transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              {isProcessingAction === "services" ? <RotateCw className="w-3 h-3 animate-spin text-cyan-400" /> : "⚡ Restart Services"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAction("temp")}
                              disabled={isProcessingAction !== null}
                              className="flex-1 min-w-[95px] text-center px-2 py-1.5 text-[9px] font-mono font-bold uppercase rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-pink-300 hover:text-white transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              {isProcessingAction === "temp" ? <RotateCw className="w-3 h-3 animate-spin text-pink-400" /> : "🗑️ Clear Temp Files"}
                            </button>
                          </div>
                          {diagnosticsLog && (
                            <div className="text-[9px] font-mono text-slate-400 border-t border-slate-850/45 pt-2 mt-2 flex items-center gap-2">
                              <span className={isProcessingAction ? "relative flex h-2 w-2" : "text-emerald-400 animate-pulse"}>
                                {isProcessingAction ? (
                                  <>
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                                  </>
                                ) : (
                                  "●"
                                )}
                              </span>
                              <span className="truncate">{diagnosticsLog}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Section: Timeseries SVG (span 7/12 when maximized) */}
                      {isDiagnosticsMaximized ? (
                        <div className="md:col-span-12 lg:col-span-7 flex flex-col justify-between h-full space-y-4">
                          <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex flex-col justify-between flex-1 min-h-[300px]">
                            
                            <div className="flex items-center justify-between mb-3 border-b border-slate-850 pb-2">
                              <div>
                                <span className="text-[10px] font-mono font-bold text-slate-300 block uppercase">Telemetry Historic Analytics (30m)</span>
                                <span className="text-[9px] font-mono text-slate-500 font-medium">Vector-drawn continuous sliding telemetry data</span>
                              </div>
                              <div className="flex bg-slate-950 p-1 rounded border border-slate-850 gap-1 text-[9px] font-mono">
                                <button
                                  type="button"
                                  onClick={() => setSelectedChartType("all")}
                                  className={`px-2 py-0.5 rounded cursor-pointer ${
                                    selectedChartType === "all" ? "bg-indigo-600/35 text-indigo-300 font-bold" : "text-slate-400 hover:text-slate-200"
                                  }`}
                                >
                                  ALL
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedChartType("cpu")}
                                  className={`px-2 py-0.5 rounded cursor-pointer ${
                                    selectedChartType === "cpu" ? "bg-indigo-600/35 text-indigo-300 font-bold" : "text-slate-400 hover:text-slate-200"
                                  }`}
                                >
                                  CPU
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedChartType("ram")}
                                  className={`px-2 py-0.5 rounded cursor-pointer ${
                                    selectedChartType === "ram" ? "bg-pink-600/35 text-pink-300 font-bold" : "text-slate-400 hover:text-slate-200"
                                  }`}
                                >
                                  RAM
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedChartType("disk")}
                                  className={`px-2 py-0.5 rounded cursor-pointer ${
                                    selectedChartType === "disk" ? "bg-emerald-600/35 text-emerald-300 font-bold" : "text-slate-400 hover:text-slate-200"
                                  }`}
                                >
                                  DISK
                                </button>
                              </div>
                            </div>

                            {telemetryHistoryLog.length >= 2 ? (() => {
                              const n = telemetryHistoryLog.length;
                              const H = 140;
                              const W = 350;
                              const padX = 40;
                              const padY = 20;

                              const getSvgPathStr = (type: "cpu" | "ram" | "diskRead" | "diskWrite", fill = false) => {
                                let pts = "";
                                telemetryHistoryLog.forEach((p, idx) => {
                                  const x = padX + (idx / (n - 1)) * W;
                                  let val = 0;
                                  if (type === "cpu") val = p.cpu;
                                  else if (type === "ram") val = p.ram;
                                  else if (type === "diskRead") val = (Math.min(p.diskRead, 30) / 30) * 100;
                                  else if (type === "diskWrite") val = (Math.min(p.diskWrite, 30) / 30) * 100;

                                  const y = padY + H - (val / 100) * H;
                                  pts += `${idx === 0 ? "M" : "L"} ${x} ${y} `;
                                });

                                if (fill) {
                                  const xFirst = padX;
                                  const xLast = padX + W;
                                  const yBottom = padY + H;
                                  pts += `L ${xLast} ${yBottom} L ${xFirst} ${yBottom} Z`;
                                }
                                return pts;
                              };

                              return (
                                <div className="flex-1 flex flex-col justify-between">
                                  <svg className="w-full h-[185px] overflow-visible" viewBox="0 0 410 185">
                                    <defs>
                                      <linearGradient id="cpuAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                                      </linearGradient>
                                      <linearGradient id="ramAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                                      </linearGradient>
                                      <linearGradient id="diskAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                      </linearGradient>
                                    </defs>

                                    {[0, 25, 50, 75, 100].map((tick) => {
                                      const y = padY + H - (tick / 100) * H;
                                      return (
                                        <g key={tick} className="opacity-45 text-slate-500">
                                          <line
                                            x1={padX}
                                            y1={y}
                                            x2={padX + W}
                                            y2={y}
                                            stroke="#1e293b"
                                            strokeDasharray="2 3"
                                            strokeWidth="1"
                                          />
                                          <text x={padX - 8} y={y + 3} textAnchor="end" className="text-[8px] font-mono fill-slate-500 font-medium">
                                            {selectedChartType === "disk" ? `${Math.round(tick * 30 / 100)}Mb` : `${tick}%`}
                                          </text>
                                        </g>
                                      );
                                    })}

                                    <g className="text-slate-500">
                                      <line x1={padX} y1={padY + H} x2={padX + W} y2={padY + H} stroke="#334155" strokeWidth="1" />
                                      <text x={padX} y={padY + H + 12} className="text-[8px] font-mono fill-slate-500" textAnchor="start">30m ago</text>
                                      <text x={padX + W / 2} y={padY + H + 12} className="text-[8px] font-mono fill-slate-500" textAnchor="middle">15m ago</text>
                                      <text x={padX + W} y={padY + H + 12} className="text-[8px] font-mono fill-slate-500" textAnchor="end">Now</text>
                                    </g>

                                    {(selectedChartType === "all" || selectedChartType === "cpu") && (
                                      <>
                                        <path d={getSvgPathStr("cpu", true)} fill="url(#cpuAreaGrad)" />
                                        <path d={getSvgPathStr("cpu", false)} fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
                                      </>
                                    )}
                                    {(selectedChartType === "all" || selectedChartType === "ram") && (
                                      <>
                                        <path d={getSvgPathStr("ram", true)} fill="url(#ramAreaGrad)" />
                                        <path d={getSvgPathStr("ram", false)} fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
                                      </>
                                    )}
                                    {selectedChartType === "disk" && (
                                      <>
                                        <path d={getSvgPathStr("diskRead", true)} fill="url(#diskAreaGrad)" />
                                        <path d={getSvgPathStr("diskRead", false)} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d={getSvgPathStr("diskWrite", false)} fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
                                      </>
                                    )}
                                  </svg>

                                  <div className="flex flex-wrap items-center justify-center gap-4 text-[9px] font-mono border-t border-slate-850 pt-2 text-slate-400">
                                    {(selectedChartType === "all" || selectedChartType === "cpu") && (
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-1.5 bg-indigo-500 rounded-sm"></span>
                                        <span>CPU: avg {((telemetryHistoryLog.reduce((acc, p) => acc + p.cpu, 0)) / n).toFixed(1)}%</span>
                                      </div>
                                    )}
                                    {(selectedChartType === "all" || selectedChartType === "ram") && (
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-1.5 bg-pink-500 rounded-sm"></span>
                                        <span>RAM: avg {((telemetryHistoryLog.reduce((acc, p) => acc + p.ram, 0)) / n).toFixed(1)}%</span>
                                      </div>
                                    )}
                                    {selectedChartType === "disk" && (
                                      <>
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-2.5 h-1.5 bg-emerald-500 rounded-sm"></span>
                                          <span>Disk Read</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-2.5 border-t border-dashed border-cyan-400"></span>
                                          <span>Disk Write</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })() : (
                              <div className="text-[10px] font-mono font-semibold text-slate-500 text-center py-12">
                                Populating timeline sliding cache logs...
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Minimized Sparkline Chart default */
                        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Disk Write 10s History Chart</span>
                            <span className="text-[9px] font-mono text-cyan-400">Realtime Spark</span>
                          </div>
                          <div className="flex items-end gap-1 h-[45px] pt-1">
                            {diskWriteHist.map((val, idx) => {
                              const h = Math.min((val / 15) * 100, 100);
                              return (
                                <div
                                  key={idx}
                                  title={`Write: ${val} MB/s`}
                                  className="bg-cyan-500/70 hover:bg-cyan-400 flex-1 rounded-t transition-all duration-500 cursor-pointer"
                                  style={{ height: `${h}%` }}
                                ></div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )}

              {/* Sidebar Config segment (Alerts, Firewall & Backups) */}
              {!(activeDetailTab === "diagnostics" && isDiagnosticsMaximized) && (
                <div className="space-y-6">
                
                {/* Task 4: Custom CPU & RAM Threshold alerts configuration */}
                <div className="bg-slate-950 rounded-xl border border-slate-850 p-4 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-900">
                    <span className="text-xs font-bold font-mono tracking-wider uppercase text-pink-400 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-pink-400" /> Threshold Alerts
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleAlerts}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        selectedVps.alerts?.enabled ? "bg-indigo-600" : "bg-slate-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                          selectedVps.alerts?.enabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-[11px] font-mono mb-1">
                        <span className="text-slate-400">CPU Load Threshold:</span>
                        <span className="text-pink-400 font-bold">{selectedVps.alerts?.cpuThreshold ?? 80}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="95"
                        value={selectedVps.alerts?.cpuThreshold ?? 80}
                        disabled={!selectedVps.alerts?.enabled}
                        onChange={(e) => handleAlertChange("cpuThreshold", parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-900 rounded accent-pink-400 disabled:opacity-30 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-mono mb-1">
                        <span className="text-slate-400">RAM Limit Alert:</span>
                        <span className="text-pink-400 font-bold">{selectedVps.alerts?.ramThreshold ?? 80}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="95"
                        value={selectedVps.alerts?.ramThreshold ?? 80}
                        disabled={!selectedVps.alerts?.enabled}
                        onChange={(e) => handleAlertChange("ramThreshold", parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-900 rounded accent-pink-400 disabled:opacity-30 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">Notification Receiver Email</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="ops-manager@nebulahost.dev"
                          value={selectedVps.alerts?.email ?? ""}
                          disabled={!selectedVps.alerts?.enabled}
                          onChange={(e) => handleAlertChange("email", e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-850 rounded px-2.5 py-1 text-xs outline-none focus:border-indigo-400 text-slate-200 font-mono disabled:opacity-30"
                        />
                        <button
                          type="button"
                          onClick={handleSendTestAlertEmail}
                          disabled={!selectedVps.alerts?.enabled || !selectedVps.alerts?.email}
                          className="px-2.5 py-1 bg-pink-950/40 hover:bg-pink-900/50 border border-pink-900/40 disabled:opacity-20 text-[10px] font-mono text-pink-300 rounded transition cursor-pointer flex items-center gap-1"
                        >
                          <Mail className="w-3.5 h-3.5 text-pink-400 animate-bounce" /> Test
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Firewall Rules Setup */}
                <div className="bg-slate-950 rounded-xl border border-slate-850 p-4 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-900 text-indigo-400">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs font-bold font-mono tracking-wider uppercase">Active Firewall Grids</span>
                  </div>

                  <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                    {selectedVps.firewalls.map((rule) => (
                      <div key={rule.port} className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-850">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-bold text-slate-200">Port {rule.port} ({rule.protocol})</span>
                          <span className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">{rule.allowed}</span>
                        </div>
                        <button
                          onClick={() => deleteFirewallRule(rule.port)}
                          className="text-slate-600 hover:text-rose-400 p-1 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Firewall Rule */}
                  <form onSubmit={addFirewallRule} className="grid grid-cols-12 gap-2 pt-2 border-t border-slate-900">
                    <div className="col-span-4">
                      <input
                        type="number"
                        placeholder="Port"
                        value={fwPort || ""}
                        onChange={(e) => setFwPort(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-850 rounded px-2 py-1 text-xs outline-none focus:border-indigo-400 text-slate-200 font-mono"
                        required
                      />
                    </div>
                    <div className="col-span-4">
                      <select
                        value={fwProtocol}
                        onChange={(e) => setFwProtocol(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-850 rounded px-2 py-1 text-xs outline-none focus:border-indigo-400 text-slate-300 font-mono align-middle"
                      >
                        <option value="TCP">TCP</option>
                        <option value="UDP">UDP</option>
                      </select>
                    </div>
                    <div className="col-span-4 flex">
                      <button type="submit" className="w-full bg-slate-800 border border-slate-705 text-slate-200 font-mono text-[10px] uppercase rounded hover:bg-indigo-900/40 hover:text-indigo-300 transition cursor-pointer flex items-center justify-center gap-1">
                        <Plus className="w-3 h-3" /> Rule
                      </button>
                    </div>
                  </form>
                </div>

                {/* Task 5: Snapshot Backups Registry & Automated Scheduler */}
                <div className="bg-slate-950 rounded-xl border border-slate-850 p-4 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-900">
                    <span className="text-xs font-bold font-mono tracking-wider uppercase text-cyan-405 text-cyan-450 text-indigo-305 text-cyan-400 flex items-center gap-1.5">
                      <Database className="w-4 h-4 animate-pulse text-cyan-400" /> Snapshots & Policy
                    </span>
                    <button
                      type="button"
                      onClick={triggerBackup}
                      className="text-[10px] font-mono border border-cyan-800 bg-cyan-950/45 text-cyan-400 px-2 py-0.5 rounded hover:bg-cyan-900/35 transition cursor-pointer"
                    >
                      Instant Snapshot
                    </button>
                  </div>

                  {/* Auto snapshot policy scheduler settings UI */}
                  <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-850 space-y-3 font-mono text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-bold uppercase tracking-wider">Cron Automations</span>
                      <button
                        type="button"
                        onClick={() => {
                          const sched = snapshotSchedules[selectedVps.id] || { enabled: false, interval: "daily", customCron: "0 0 * * *" };
                          updateSnapshotSchedule(sched.interval, !sched.enabled, sched.customCron);
                        }}
                        className={`px-2 py-0.5 border rounded uppercase text-[9px] font-bold cursor-pointer transition ${
                          (snapshotSchedules[selectedVps.id]?.enabled)
                            ? "bg-emerald-950/45 border-emerald-800 text-emerald-400"
                            : "bg-slate-950 text-slate-500 border-slate-850"
                        }`}
                      >
                        {snapshotSchedules[selectedVps.id]?.enabled ? "⬤ Enabled" : "⬤ Paused"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-950/40">
                      <div>
                        <span className="block text-[8px] text-slate-500 uppercase font-semibold">Frequency</span>
                        <select
                          value={snapshotSchedules[selectedVps.id]?.interval || "daily"}
                          onChange={(e) => {
                            const sched = snapshotSchedules[selectedVps.id] || { enabled: false, interval: "daily", customCron: "0 0 * * *" };
                            updateSnapshotSchedule(e.target.value as any, sched.enabled, sched.customCron);
                          }}
                          className="bg-transparent text-[10px] outline-none text-slate-300 font-bold cursor-pointer mt-0.5 w-full border-none p-0"
                        >
                          <option value="hourly">Hourly Run</option>
                          <option value="daily">Daily Run</option>
                          <option value="weekly">Weekly Run</option>
                          <option value="custom">Custom Cron</option>
                        </select>
                      </div>

                      <div>
                        <span className="block text-[8px] text-slate-500 uppercase font-semibold">Cron Pattern</span>
                        {snapshotSchedules[selectedVps.id]?.interval === "custom" ? (
                          <input
                            type="text"
                            value={snapshotSchedules[selectedVps.id]?.customCron || "0 0 * * *"}
                            onChange={(e) => {
                              const sched = snapshotSchedules[selectedVps.id] || { enabled: false, interval: "daily", customCron: "0 0 * * *" };
                              updateSnapshotSchedule("custom", sched.enabled, e.target.value);
                            }}
                            className="bg-slate-950 border border-slate-850 rounded px-1.5 py-0.5 text-[9px] w-full text-slate-300 tracking-wider font-bold"
                          />
                        ) : (
                          <span className="text-slate-400 block font-bold mt-1 text-[9px] uppercase tracking-wide">{snapshotSchedules[selectedVps.id]?.customCron || "0 0 * * *"}</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[8px] text-slate-550 text-slate-500 pt-1.5 border-t border-slate-950/40">
                      <div>
                        <span>Last Successful Run:</span>
                        <span className="block text-slate-400 font-bold mt-0.5">{snapshotSchedules[selectedVps.id]?.lastRun || "Never"}</span>
                      </div>
                      <div>
                        <span>Next Scheduled Queue:</span>
                        <span className="block text-indigo-400 font-bold truncate mt-0.5">{snapshotSchedules[selectedVps.id]?.nextRun || "Not Scheduled"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Backups List */}
                  <div className="space-y-1.5 max-h-[110px] overflow-y-auto">
                    {selectedVps.backups.length === 0 ? (
                      <div className="text-[10px] font-mono text-slate-600 text-center py-4">No snapshots registered.</div>
                    ) : (
                      selectedVps.backups.map((bak, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs font-mono bg-slate-900/60 p-2.5 rounded border border-slate-900">
                          <div className="flex items-center gap-1.5 text-slate-350">
                            <CornerDownRight className="w-3.5 h-3.5 text-slate-600" />
                            <span>{bak.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <span>{bak.size}</span>
                            <span className="text-emerald-400 border border-emerald-900 px-1 text-[8px] rounded uppercase bg-emerald-950/20 font-bold">ACTIVE</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
              )}

            </div>

          </div>
        )}
      </div>
      {/* Configure Threshold Alerts Modal Dialog */}
      {isAlertModalOpen && selectedVps && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={saveAlertSettings}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative font-sans animate-in fade-in zoom-in duration-150"
          >
            {/* Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-850 flex items-center justify-between">
              <span className="text-xs font-bold font-mono tracking-wider uppercase text-pink-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-pink-400" /> Threshold Configurations
              </span>
              <button
                type="button"
                onClick={() => setIsAlertModalOpen(false)}
                className="text-slate-500 hover:text-slate-350 cursor-pointer font-sans text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-6 space-y-4 font-sans">
              <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                Configure real-time hypervisor-level CPU and RAM telemetry notification hooks. Breaches will highlight warning zones and dispatch warnings.
              </p>

              {/* Toggle switch */}
              <div className="flex items-center justify-between bg-slate-950/40 border border-slate-850 p-2.5 rounded-lg font-sans">
                <span className="text-xs font-mono text-slate-300">Status Alerting Actions</span>
                <button
                  type="button"
                  onClick={() => setEditAlertEnabled(!editAlertEnabled)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    editAlertEnabled ? "bg-indigo-600" : "bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                      editAlertEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* CPU load Limit */}
              <div className={editAlertEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}>
                <div className="flex justify-between text-[11px] font-mono mb-1">
                  <span className="text-slate-400">⚡ CPU Alert Limit:</span>
                  <span className="text-pink-400 font-bold">{editCpuThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="95"
                  value={editCpuThreshold}
                  onChange={(e) => setEditCpuThreshold(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-950 rounded accent-pink-400 cursor-pointer"
                />
              </div>

              {/* RAM utilization limit */}
              <div className={editAlertEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}>
                <div className="flex justify-between text-[11px] font-mono mb-1">
                  <span className="text-slate-400">🧠 RAM Memory Limit:</span>
                  <span className="text-pink-400 font-bold">{editRamThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="95"
                  value={editRamThreshold}
                  onChange={(e) => setEditRamThreshold(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-950 rounded accent-pink-400 cursor-pointer"
                />
              </div>

              {/* Target Notification Email */}
              <div className={editAlertEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">Notification Receiver Email</label>
                <input
                  type="email"
                  required={editAlertEnabled}
                  placeholder="alerts@nebulahost.dev"
                  value={editAlertEmail}
                  onChange={(e) => setEditAlertEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-1.5 text-xs outline-none focus:border-indigo-400 text-slate-200 font-mono"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-950 px-6 py-4 border-t border-slate-855 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAlertModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-800 bg-transparent text-xs font-semibold text-slate-400 rounded-lg hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 border border-indigo-550 text-white text-xs font-semibold rounded-lg hover:bg-indigo-500 transition shadow-md flex items-center gap-1 cursor-pointer"
              >
                Save Limits
              </button>
            </div>
          </form>
        </div>
      )}
      </div>
      )}
    </div>
  );
}
