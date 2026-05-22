import React, { useState, useEffect } from "react";
import {
  Server, Cpu, Bot, RefreshCw, Layers, Globe, Shield, CreditCard, Users, Landmark,
  Activity, Clock, ChevronRight, Database, FileText, Send, HelpCircle, TrendingUp,
  Wifi, Check, Copy, ArrowUpRight, Plus, Trash2, ShieldCheck, Key, Settings, Menu, X, Terminal
} from "lucide-react";
import DeployHub from "./components/DeployHub";
import VpsManager from "./components/VpsManager";
import { EdgeNode, ConnectedDomain, TeamMember, AuditLog, Invoice } from "./types";

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    "overview" | "deployments" | "vps" | "kubernetes" | "copilot" | "domains" | "billing" | "teams" | "admin"
  >("overview");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Time ticker (initializing with current user metadata time)
  const [currentTime, setCurrentTime] = useState<Date>(new Date("2026-05-22T13:47:51Z"));

  // Live dynamic telemetry metrics
  const [cpuLoad, setCpuLoad] = useState(42.8);
  const [ramLoad, setRamLoad] = useState(12.4);
  const [networkSpeed, setNetworkSpeed] = useState(2.4);
  const [cpuHistory, setCpuHistory] = useState<number[]>([35, 40, 38, 45, 41, 48, 42]);
  
  // Infrastructure status from backend
  const [nodes, setNodes] = useState<EdgeNode[]>([
    { id: "us-east-1", name: "US East (N. Virginia)", status: "healthy", rtt: "12ms", load: 42, cpu: 32, ram: 58, bandwidth: "7.2 Gbps" },
    { id: "eu-central-1", name: "EU Central (Frankfurt)", status: "healthy", rtt: "28ms", load: 68, cpu: 55, ram: 74, bandwidth: "9.1 Gbps" },
    { id: "ap-south-1", name: "AP South (Mumbai)", status: "healthy", rtt: "84ms", load: 24, cpu: 18, ram: 41, bandwidth: "4.8 Gbps" },
    { id: "sa-east-1", name: "SA East (São Paulo)", status: "degraded", rtt: "115ms", load: 15, cpu: 12, ram: 30, bandwidth: "2.1 Gbps" }
  ]);
  const [selectedNode, setSelectedNode] = useState<EdgeNode | null>(null);

  // Kubernetes States
  const [k8sReplicas, setK8sReplicas] = useState(3);
  const [k8sAutoscale, setK8sAutoscale] = useState(true);
  const [podsList, setPodsList] = useState([
    { name: "nebula-ingress-68da91", status: "Running", cpu: "1.2%", ram: "180MB" },
    { name: "auth-worker-7df1c0", status: "Running", cpu: "0.8%", ram: "220MB" },
    { name: "metrics-daemon-df9bfb", status: "Running", cpu: "2.4%", ram: "140MB" },
    { name: "api-broker-bbdcf1", status: "Pending", cpu: "0.0%", ram: "0MB" }
  ]);

  // AI Copilot State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "model"; content: string }[]>([
    { role: "model", content: "Greetings! I am the Nebula Host AI Co-pilot. I can generate production Dockerfiles, secure Kubernetes orchestrators, Nginx proxies, or write terraform scripts. What modern infra block shall we scaffold today?" }
  ]);
  const [isAiCopilotLoading, setIsAiCopilotLoading] = useState(false);

  // Domains State
  const [domainList, setDomainList] = useState<ConnectedDomain[]>([
    {
      id: "dom-1",
      domainName: "nebulahost.dev",
      sslType: "Cloudflare",
      sslStatus: "active",
      dnsRecords: [
        { type: "A", name: "@", value: "104.24.12.189", proxied: true },
        { type: "CNAME", name: "www", value: "cname.nebulahost.dev", proxied: true }
      ]
    },
    {
      id: "dom-2",
      domainName: "stellar-deploy.net",
      sslType: "LetsEncrypt",
      sslStatus: "active",
      dnsRecords: [
        { type: "A", name: "@", value: "89.207.132.88", proxied: false }
      ]
    }
  ]);
  const [newDomain, setNewDomain] = useState("");

  // Billing Coupon System
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro" | "enterprise">("pro");

  // Multi User and Teams state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: "tm-1", name: "S. Peterson", email: "s.peterson@nebulahost.dev", role: "Owner", status: "Active" },
    { id: "tm-2", name: "Elena Rostova", email: "elena@nebulahost.dev", role: "Developer", status: "Active" },
    { id: "tm-3", name: "John Miller", email: "j.miller@nebulahost.dev", role: "Analyst", status: "Pending" }
  ]);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamMember["role"]>("Developer");

  // Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: "log-1", timestamp: "2026-05-22 13:40 UTC", actor: "S. Peterson", action: "DEPLOY_TRIGGER", target: "nebula-gateway", ip: "192.168.1.10" },
    { id: "log-2", timestamp: "2026-05-22 13:28 UTC", actor: "Elena Rostova", action: "FIREWALL_ALLOW_PORT", target: "production-monolith-01 (Port 443)", ip: "104.24.12.1" },
    { id: "log-3", timestamp: "2026-05-22 12:15 UTC", actor: "S. Peterson", action: "SSL_RENEW", target: "stellar-deploy.net", ip: "192.168.1.10" }
  ]);

  // Toast / System warnings banner
  const [bannerSaving, setBannerSaving] = useState(true);

  // Copy helpers
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Clock updates in background
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(prev => new Date(prev.getTime() + 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Telemetry metric jumps (simulates responsive live micro-fluctuations)
  useEffect(() => {
    const telemetryTimer = setInterval(() => {
      setCpuLoad(prev => {
        const delta = (Math.random() - 0.5) * 5;
        const next = Math.min(Math.max(parseFloat((prev + delta).toFixed(1)), 15), 95);
        // update chart history
        setCpuHistory(hist => [...hist.slice(1), Math.round(next)]);
        return next;
      });
      setRamLoad(prev => {
        const delta = (Math.random() - 0.5) * 0.4;
        return Math.min(Math.max(parseFloat((prev + delta).toFixed(1)), 8), 32);
      });
      setNetworkSpeed(prev => {
        const delta = (Math.random() - 0.5) * 0.2;
        return Math.min(Math.max(parseFloat((prev + delta).toFixed(1)), 0.5), 10);
      });
    }, 4000);
    return () => clearInterval(telemetryTimer);
  }, []);

  // API load for infrastructure
  useEffect(() => {
    async function fetchInfraMetrics() {
      try {
        const res = await fetch("/api/infrastructure");
        const data = await res.json();
        if (data.nodes) {
          setNodes(data.nodes);
        }
      } catch (err) {
        console.warn("Unable to fetch initial live node telemetry. Falling back to robust simulation state.");
      }
    }
    fetchInfraMetrics();
  }, []);

  // AI Chat Co-pilot send query
  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiCopilotLoading) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setIsAiCopilotLoading(true);

    try {
      const response = await fetch("/api/ai/shell-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: chatMessages,
          currentMessage: userMsg
        })
      });
      const data = await response.json();
      if (data.message) {
        setChatMessages(prev => [...prev, { role: "model", content: data.message }]);
      } else {
        setChatMessages(prev => [...prev, { role: "model", content: "Error communicating with AI microservice." }]);
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: "model", content: `Failed to invoke Gemini pipeline: ${err.message}` }]);
    } finally {
      setIsAiCopilotLoading(false);
    }
  };

  // Add Domain
  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.includes(".") || newDomain.length < 4) return;
    const item: ConnectedDomain = {
      id: `dom-${Math.floor(Math.random() * 1000)}`,
      domainName: newDomain.trim().toLowerCase(),
      sslType: "LetsEncrypt",
      sslStatus: "pending",
      dnsRecords: [
        { type: "A", name: "@", value: "104.24.12.189", proxied: true }
      ]
    };
    setDomainList([...domainList, item]);
    setNewDomain("");
    // Log audit
    setAuditLogs([
      { id: `log-${Date.now()}`, timestamp: "Just Now", actor: "S. Peterson", action: "DOMAIN_ADD", target: newDomain, ip: "192.168.1.10" },
      ...auditLogs
    ]);
  };

  // Coupon Checker
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const code = couponCode.trim().toUpperCase();
    if (code === "NEBULA_AI_50") {
      setCouponDiscount(50);
      setCouponApplied(true);
    } else if (code === "FREE_DEV_99") {
      setCouponDiscount(99);
      setCouponApplied(true);
    } else {
      setCouponError("Invalid promo code. Telemetry registry returned negative validation.");
    }
    setCouponCode("");
  };

  const handleCreateTeamInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;
    const member: TeamMember = {
      id: `tm-${Math.floor(Math.random() * 100) + 10}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      status: "Pending"
    };
    setTeamMembers([...teamMembers, member]);
    setInviteName("");
    setInviteEmail("");
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-100 flex flex-col md:flex-row relative overflow-hidden font-sans">
      
      {/* Mesh Graduate Futuristic Background Highlights */}
      <div className="absolute top-[-150px] right-[-150px] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] left-[150px] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Sidebar - responsive glass sidebar */}
      <aside className={`md:w-68 flex-shrink-0 bg-slate-950/45 border-b md:border-b-0 md:border-r border-slate-800/40 backdrop-blur-2xl flex flex-col z-20 ${mobileMenuOpen ? "absolute inset-0 h-screen w-full" : "relative"}`}>
        
        {/* Branding */}
        <div className="p-6 flex items-center justify-between border-b border-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-[0_0_18px_rgba(99,102,241,0.5)]">
              <span className="font-extrabold text-[#020617] font-mono text-xl">N</span>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block">
                Nebula<span className="text-cyan-400">Host</span>
              </span>
              <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase">AI Cloud Core</span>
            </div>
          </div>
          
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation Sidebar List */}
        <nav className={`flex-1 p-4 space-y-1 overflow-y-auto ${mobileMenuOpen ? "block" : "hidden md:block"}`}>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 px-3 mb-2 font-mono">Operations</div>
          
          <button
            onClick={() => { setActiveTab("overview"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-sm transition-all duration-200 border ${
              activeTab === "overview"
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-semibold shadow-inner"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <Activity className="w-4.5 h-4.5" />
              <span>Realtime Matrix</span>
            </div>
            {activeTab === "overview" && <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>}
          </button>

          <button
            onClick={() => { setActiveTab("deployments"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-sm transition-all duration-200 border ${
              activeTab === "deployments"
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-semibold shadow-inner"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers className="w-4.5 h-4.5" />
              <span>AI Deploy Hub</span>
            </div>
            {activeTab === "deployments" && <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>}
          </button>

          <button
            onClick={() => { setActiveTab("vps"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-sm transition-all duration-200 border ${
              activeTab === "vps"
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-semibold shadow-inner"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <Server className="w-4.5 h-4.5" />
              <span>VPS Virtual Nodes</span>
            </div>
            {activeTab === "vps" && <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>}
          </button>

          <button
            onClick={() => { setActiveTab("kubernetes"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-sm transition-all duration-200 border ${
              activeTab === "kubernetes"
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-semibold shadow-inner"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <Database className="w-4.5 h-4.5" />
              <span>Kubernetes Orchestrator</span>
            </div>
            {activeTab === "kubernetes" && <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>}
          </button>

          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 px-3 pt-6 mb-2 font-mono">Intelligence</div>

          <button
            onClick={() => { setActiveTab("copilot"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-sm transition-all duration-200 border ${
              activeTab === "copilot"
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-semibold shadow-inner"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <Bot className="w-4.5 h-4.5 text-cyan-400 animate-pulse" />
              <span className="font-medium text-slate-200">DevOps Shell Bot</span>
            </div>
            <span className="text-[9px] font-semibold bg-cyan-950/80 border border-cyan-800 text-cyan-400 px-2 py-0.5 rounded-full font-mono">LIVE</span>
          </button>

          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 px-3 pt-6 mb-2 font-mono">Routing & Workspace</div>

          <button
            onClick={() => { setActiveTab("domains"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-sm transition-all duration-200 border ${
              activeTab === "domains"
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-semibold shadow-inner"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <Globe className="w-4.5 h-4.5" />
              <span>Domains & SSL Link</span>
            </div>
          </button>

          <button
            onClick={() => { setActiveTab("billing"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-sm transition-all duration-200 border ${
              activeTab === "billing"
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-semibold shadow-inner"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-4.5 h-4.5" />
              <span>Billing & Plan tier</span>
            </div>
          </button>

          <button
            onClick={() => { setActiveTab("teams"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-sm transition-all duration-200 border ${
              activeTab === "teams"
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-semibold shadow-inner"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4.5 h-4.5" />
              <span>Team Workspace</span>
            </div>
          </button>

          <button
            onClick={() => { setActiveTab("admin"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-sm transition-all duration-200 border ${
              activeTab === "admin"
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-semibold shadow-inner"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <Landmark className="w-4.5 h-4.5" />
              <span>Platform Administration</span>
            </div>
            <span className="text-[9px] bg-indigo-950/80 border border-indigo-805 text-indigo-400 px-2 py-0.5 rounded font-mono">CORE</span>
          </button>
        </nav>

        {/* User Card - Elegant frosted card */}
        <div className={`p-4 border-t border-slate-900/60 mt-auto bg-slate-950/20 ${mobileMenuOpen ? "block" : "hidden md:block"}`}>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 backdrop-blur-md">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md border border-white/10">SP</div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">S. Peterson</p>
              <p className="text-[10px] text-indigo-400 uppercase tracking-wider font-mono">Enterprise Architect</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container Area */}
      <main className="flex-1 flex flex-col z-10 overflow-x-hidden min-h-screen">
        
        {/* Top Header - Frosted bar */}
        <header className="h-20 flex-shrink-0 flex items-center justify-between px-6 md:px-10 border-b border-slate-800/50 bg-slate-950/20 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                System Matrix
                <span className="text-xs font-mono font-normal tracking-normal text-slate-400 hidden sm:inline">({activeTab.toUpperCase()})</span>
              </h1>
              <p className="text-[10px] md:text-xs text-slate-400 font-mono tracking-widest uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Global Cluster: Tokyo-NW-04 • Uptime 99.999%
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden lg:flex items-center gap-2 text-slate-300 font-mono text-xs bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentTime.toISOString().replace("T", " ").substring(0, 19)} UTC</span>
            </div>

            <button 
              onClick={() => setActiveTab("deployments")}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New Deployment
            </button>
          </div>
        </header>

        {/* Outer content view wrapper */}
        <div className="p-4 md:p-8 flex-1 overflow-y-auto">
          
          {/* Active Tab Screen router */}
          
          {/* TAB 1: OVERVIEW & REALTIME MATRIX */}
          {activeTab === "overview" && (
            <div className="space-y-6" id="overview_tab_wrapper">
              
              {/* Telemetry Metric Bento Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Metric Card 1 */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl hover:border-slate-700/60 transition-all duration-300 relative group overflow-hidden">
                  <div className="absolute top-0 left-0 h-1 w-0 bg-indigo-500 group-hover:w-full transition-all duration-500"></div>
                  <div className="flex justify-between items-start">
                    <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">CPU Compute</p>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-mono">Live</span>
                  </div>
                  <p className="text-4xl font-extrabold mt-3 text-white tracking-tight">{cpuLoad.toFixed(1)}<span className="text-lg font-light text-slate-500">%</span></p>
                  <div className="mt-4 h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500" style={{ width: `${cpuLoad}%` }}></div>
                  </div>
                </div>

                {/* Metric Card 2 */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl hover:border-slate-700/60 transition-all duration-300 relative group overflow-hidden">
                  <div className="absolute top-0 left-0 h-1 w-0 bg-purple-500 group-hover:w-full transition-all duration-500"></div>
                  <div className="flex justify-between items-start">
                    <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">Memory Stack</p>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">Optimized</span>
                  </div>
                  <p className="text-4xl font-extrabold mt-3 text-white tracking-tight">{ramLoad.toFixed(1)}<span className="text-lg font-light text-slate-500">GB</span></p>
                  <div className="mt-4 h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-505" style={{ width: `${(ramLoad / 32) * 100}%` }}></div>
                  </div>
                </div>

                {/* Metric Card 3 */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl hover:border-slate-700/60 transition-all duration-300 relative group overflow-hidden">
                  <div className="absolute top-0 left-0 h-1 w-0 bg-cyan-500 group-hover:w-full transition-all duration-500"></div>
                  <div className="flex justify-between items-start">
                    <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">Traffic Load</p>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-mono">Dynamic</span>
                  </div>
                  <p className="text-4xl font-extrabold mt-3 text-white tracking-tight">{networkSpeed.toFixed(1)}<span className="text-lg font-light text-slate-500">TB/s</span></p>
                  <div className="mt-4 flex gap-1 items-end h-7">
                    <div className="w-2.5 bg-cyan-500/30 rounded-t h-2 animate-pulse"></div>
                    <div className="w-2.5 bg-cyan-500/50 rounded-t h-4"></div>
                    <div className="w-2.5 bg-cyan-500/60 rounded-t h-3"></div>
                    <div className="w-2.5 bg-cyan-500/80 rounded-t h-6"></div>
                    <div className="w-2.5 bg-cyan-500 rounded-t h-5"></div>
                    <div className="w-2.5 bg-cyan-400 rounded-t h-[28px] animate-pulse"></div>
                  </div>
                </div>

                {/* Metric Card 4: AI Agent suggestion block */}
                <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
                  <div className="relative z-10">
                    <div className="flex items-center gap-1 text-indigo-400 text-xs font-bold uppercase tracking-widest font-mono">
                      <Bot className="w-4 h-4 animate-bounce" />
                      <span>Nebula Live AI Agent</span>
                    </div>
                    <p className="text-xs text-indigo-200 mt-2 italic leading-relaxed">
                      Cluster over-provision identified inside US-East-1. Dynamic downscale recommended.
                    </p>
                  </div>
                  
                  {bannerSaving ? (
                    <div className="mt-4 pt-4 border-t border-indigo-500/20 flex items-center justify-between relative z-10">
                      <span className="text-[11px] text-amber-300 font-bold font-mono">Potential Save: $2,400/mo</span>
                      <button 
                        onClick={() => {
                          setBannerSaving(false);
                          setAuditLogs([{
                            id: `log-${Date.now()}`,
                            action: "AI_DOWNSCALE_EXECUTE",
                            actor: "S. Peterson",
                            target: "Tokyo node optimization",
                            timestamp: "Just Now",
                            ip: "127.0.0.1"
                          }, ...auditLogs]);
                        }}
                        className="text-[10px] bg-indigo-500 hover:bg-indigo-400 active:scale-95 text-white font-bold py-1.5 px-3 rounded-md cursor-pointer transition"
                      >
                        Execute Opt
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 text-xs font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                      <Check className="w-3.5 h-3.5" /> Savings rule approved.
                    </div>
                  )}

                  <div className="absolute right-[-15px] bottom-[-15px] opacity-[0.04] text-white">
                    <Bot className="w-24 h-24" />
                  </div>
                </div>

              </div>

              {/* Middle Section: Chart + Global Edge Load Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visualizer SVG Line Chart */}
                <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-wide">Live Infrastructure Telemetry Timeline</h3>
                      <p className="text-xs text-slate-400 font-mono">Simulated multi-stack dynamic hypervisor load tracker (Last 7 minutes)</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="flex items-center gap-1.5 text-indigo-400">
                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span>
                        Host CPU Load
                      </span>
                    </div>
                  </div>

                  {/* SVG Custom High-End Sci-fi Line Chart */}
                  <div className="h-56 w-full relative">
                    <svg className="w-full h-full" viewBox="0 0 700 220" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      <line x1="0" y1="20" x2="700" y2="20" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3" />
                      <line x1="0" y1="70" x2="700" y2="70" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3" />
                      <line x1="0" y1="120" x2="700" y2="120" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3" />
                      <line x1="0" y1="170" x2="700" y2="170" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3" />
                      
                      {/* Glow Filter */}
                      <defs>
                        <linearGradient id="neonGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Area Fill */}
                      <path
                        d={`M 0,220 L 0,${220 - cpuHistory[0] * 2} L 116,${220 - cpuHistory[1] * 2} L 233,${220 - cpuHistory[2] * 2} L 350,${220 - cpuHistory[3] * 2} L 466,${220 - cpuHistory[4] * 2} L 583,${220 - cpuHistory[5] * 2} L 700,${220 - cpuHistory[6] * 2} L 700,220 Z`}
                        fill="url(#neonGlow)"
                      />

                      {/* Smooth Polyline */}
                      <path
                        d={`M 0,${220 - cpuHistory[0] * 2} L 116,${220 - cpuHistory[1] * 2} L 233,${220 - cpuHistory[2] * 2} L 350,${220 - cpuHistory[3] * 2} L 466,${220 - cpuHistory[4] * 2} L 583,${220 - cpuHistory[5] * 2} L 700,${220 - cpuHistory[6] * 2}`}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="3.5"
                      />

                      {/* Moving Line Indicators Data nodes */}
                      {cpuHistory.map((val, hIdx) => (
                        <circle
                          key={hIdx}
                          cx={hIdx * 116.6}
                          cy={220 - val * 2}
                          r="5.5"
                          className="fill-cyan-400 stroke-indigo-900 stroke-[3px]"
                        />
                      ))}
                    </svg>

                    {/* Chart axis metrics labels */}
                    <div className="absolute top-1 right-2 text-[9px] font-mono text-slate-500">MAX CPU CORES (100%)</div>
                    <div className="absolute bottom-1 right-2 text-[9px] font-mono text-slate-500">IDLE TARGET (0%)</div>
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-4 px-2">
                    <span>-6 min ago</span>
                    <span>-5 min ago</span>
                    <span>-4 min ago</span>
                    <span>-3 min ago</span>
                    <span>-2 min ago</span>
                    <span>-1 min ago</span>
                    <span>Currently Active</span>
                  </div>
                </div>

                {/* Node Latency Heatmap / Selector */}
                <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white mb-2 tracking-wide uppercase font-mono text-slate-400">Global Cluster Nodes</h3>
                    <p className="text-xs text-slate-500 mb-4 leading-normal">
                      Select individual edge nodes to capture diagnostic payload and review active RTT telemetry.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {nodes.map(n => (
                      <button
                        key={n.id}
                        onClick={() => setSelectedNode(n)}
                        className={`w-full text-left p-3 rounded-xl border transition-all duration-300 relative overflow-hidden flex items-center justify-between ${
                          selectedNode?.id === n.id
                            ? "bg-indigo-950/40 border-indigo-500"
                            : "bg-slate-950/30 border-slate-850 hover:border-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${n.status === "healthy" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse" : "bg-rose-400"}`}></span>
                          <div>
                            <p className="text-xs font-bold text-white font-mono">{n.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">RTT: {n.rtt} • BW: {n.bandwidth}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-xs text-indigo-400 font-bold">{n.load}% load</span>
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Active global status ticker info */}
                  {selectedNode && (
                    <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono">
                      <p className="text-indigo-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Node {selectedNode.id} diagnostic parameters
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] text-slate-400">
                        <span>CPU limit: {(selectedNode.load * 0.8).toFixed(0)}% (Nominal)</span>
                        <span>Memory reserve: 16.0 GB</span>
                        <span>Firewall rules: 12 Active</span>
                        <span>Load Balancing: Round Robin</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Active Environments Table */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-indigo-900/10">
                  <div>
                    <h3 className="text-lg font-bold text-white">Live Edge Environments</h3>
                    <p className="text-xs text-slate-500">Virtual host deployments actively mapped to Tokyo edge routers</p>
                  </div>
                  <span className="text-xs text-cyan-400 font-mono bg-cyan-950/50 border border-cyan-900/50 px-3 py-1 rounded-full">
                    ALL SYSTEMS NOMINAL
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] text-slate-500 uppercase tracking-widest border-b border-slate-900">
                        <th className="pb-4 font-mono font-bold">Project Name</th>
                        <th className="pb-4 font-mono font-bold">Domain Binding</th>
                        <th className="pb-4 font-mono font-bold">Runtime Stack</th>
                        <th className="pb-4 font-mono font-bold font-normal">Active Region</th>
                        <th className="pb-4 font-mono font-bold text-right">Cluster Capacity</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-mono">
                      <tr className="border-b border-slate-900/40 hover:bg-slate-900/20 transition-all duration-150">
                        <td className="py-4 font-bold text-slate-100">nebula-api-core</td>
                        <td className="py-4 text-cyan-400">api.nebulahost.dev</td>
                        <td className="py-4 text-indigo-300">NextJS 14 Stack</td>
                        <td className="py-4 text-slate-400">Tokyo-NW-West</td>
                        <td className="py-4 text-right text-emerald-400">12 / 12 Pods (100%)</td>
                      </tr>
                      <tr className="border-b border-slate-900/40 hover:bg-slate-900/20 transition-all duration-150">
                        <td className="py-4 font-bold text-slate-100">quantum-dashboard-v3</td>
                        <td className="py-4 text-cyan-400">dashboard.quantum.io</td>
                        <td className="py-4 text-indigo-300">React Core SPA</td>
                        <td className="py-4 text-slate-400">EU-Central-2</td>
                        <td className="py-4 text-right text-emerald-400">8 / 8 Pods (100%)</td>
                      </tr>
                      <tr className="border-b border-slate-900/40 hover:bg-slate-900/20 transition-all duration-150">
                        <td className="py-4 font-bold text-slate-100">auth-microservice-node</td>
                        <td className="py-4 text-cyan-400">auth-flow.secure.net</td>
                        <td className="py-4 text-indigo-300">NodeJS Express API</td>
                        <td className="py-4 text-slate-400">US-East-1</td>
                        <td className="py-4 text-right text-indigo-400">2 / 5 Pods (Scale shift)</td>
                      </tr>
                      <tr className="hover:bg-slate-900/20 transition-all duration-150">
                        <td className="py-4 font-bold text-slate-100">vector-db-cluster</td>
                        <td className="py-4 text-cyan-400">vector-db.internal.cloud</td>
                        <td className="py-4 text-indigo-300">Dockerized pgvector</td>
                        <td className="py-4 text-slate-400">SA-East-1</td>
                        <td className="py-4 text-right text-emerald-400">24 / 24 Pods (100%)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: AI DEPLOMENTS ENGINE */}
          {activeTab === "deployments" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-white">AI Deployment Core</h2>
                  <p className="text-xs text-slate-400 font-mono">Connect Github and dynamically troubleshoot compilation crashes with Gemini Intel.</p>
                </div>
              </div>
              <DeployHub />
            </div>
          )}

          {/* TAB 3: VPS VIRTUAL NODES COMPONENTS */}
          {activeTab === "vps" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-white">VPS Hardware Compute</h2>
                  <p className="text-xs text-slate-400 font-mono">Deploy high-performance dedicated servers, manage SSH networks, and custom backups.</p>
                </div>
              </div>
              <VpsManager />
            </div>
          )}

          {/* TAB 4: KUBERNETES ORCHESTRATOR */}
          {activeTab === "kubernetes" && (
            <div className="space-y-6 animate-fade-in" id="k8s_manager_container">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Control plane */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2 mb-2 font-mono">
                      <Layers className="w-5 h-5" />
                      Kube Control Plane
                    </h3>
                    <p className="text-xs text-slate-400 mb-6 leading-normal font-sans">
                      Autoscale Docker container fleets across resilient high-availability Kubernetes replica structures.
                    </p>

                    <div className="space-y-6">
                      
                      {/* Replica Slider */}
                      <div className="bg-slate-950/70 p-4 border border-slate-850 rounded-xl space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">Target Replicas:</span>
                          <span className="text-cyan-400 font-bold">{k8sReplicas} Pod Instances</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="12"
                          value={k8sReplicas}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setK8sReplicas(val);
                            // Adjust pod roster dynamically
                            let next = [...podsList];
                            if (val > podsList.length) {
                              next.push({
                                name: `worker-api-${Math.random().toString(36).substr(2, 6)}`,
                                status: "Pending",
                                cpu: "0.0%",
                                ram: "0MB"
                              });
                            } else if (val < podsList.length) {
                              next.pop();
                            }
                            setPodsList(next);
                          }}
                          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                        />
                      </div>

                      {/* Autoscaling Toggle */}
                      <div className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-850 rounded-xl">
                        <div>
                          <p className="text-xs font-bold text-slate-200">Horizontal Pod Autoscaler (HPA)</p>
                          <p className="text-[10px] text-slate-500">Auto scale up on average CPU threshold trigger &gt; 75%</p>
                        </div>
                        
                        <button
                          onClick={() => setK8sAutoscale(!k8sAutoscale)}
                          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${k8sAutoscale ? "bg-cyan-500" : "bg-slate-800"}`}
                        >
                          <span className={`absolute top-1 left-1 w-4 h-4 bg-[#020617] rounded-full transition-transform ${k8sAutoscale ? "translate-x-5" : ""}`}></span>
                        </button>
                      </div>

                      <div className="p-4 bg-slate-950/30 border border-slate-900 rounded-xl text-xs space-y-2 font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500">API Server Endpoint:</span>
                          <span className="text-slate-300">kube-api.nebulahost.dev</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Scheduler Health:</span>
                          <span className="text-emerald-400">99.98% Healthy</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Active Node pool:</span>
                          <span className="text-slate-300">pool-highmem-tokyo</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setPodsList(podsList.map(p => ({ ...p, status: "Running" })));
                        }}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-mono text-slate-300 border border-slate-700 cursor-pointer text-center"
                      >
                        Force Cluster Health Check
                      </button>

                    </div>
                  </div>
                </div>

                {/* Pod diagnostics */}
                <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-800/60 mb-6">
                    <div>
                      <h3 className="text-base font-bold text-white">Replica Set Container Health Grid</h3>
                      <p className="text-xs text-slate-500 font-mono">Monitoring real-time pods status, memory caches, and cpu thresholds</p>
                    </div>
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800 px-3 py-1 rounded-full uppercase">
                      Cluster healthy • {podsList.length} Active Pods
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {podsList.map((pod, idx) => (
                      <div key={idx} className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 space-y-3 relative overflow-hidden">
                        
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-mono font-bold text-slate-200">{pod.name}</span>
                          </div>

                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            pod.status === "Running" 
                              ? "bg-emerald-950/40 border border-emerald-900 text-emerald-400" 
                              : "bg-amber-950/40 border border-amber-900 text-amber-400 animate-pulse"
                          }`}>
                            {pod.status}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-slate-900 text-slate-400">
                          <span>CPU: <strong className="text-slate-200">{pod.cpu}</strong></span>
                          <span>RAM Override: <strong className="text-slate-200">{pod.ram}</strong></span>
                        </div>

                        <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500 font-mono">
                          <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Telemetry bridge active</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dynamic cluster log readout */}
                  <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 mt-6">
                    <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 border-b border-slate-900 pb-2 mb-3">
                      <Terminal className="w-4 h-4" />
                      <span>Kubelet Scheduler Log Stream</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-300 space-y-1.5 h-32 overflow-y-auto leading-relaxed">
                      <p className="text-emerald-400/80">[Kubelet-Scheduler] Reconciling replica sets count target: {k8sReplicas} pods requested.</p>
                      <p className="text-slate-400">[info] Successfully synced pod configuration maps inside node-pool-1.</p>
                      <p className="text-slate-400">[info] Horizontal Autoscaler initialized. System load average is 41.8%.</p>
                      <p className="text-slate-400">[info] Binding node service ingress route target to Tokyo-NW Gateway.</p>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 5: AI COPILOT CHAT ASSISTANT */}
          {activeTab === "copilot" && (
            <div className="space-y-6 animate-fade-in" id="ai_copilot_container">
              
              <div className="max-w-4xl mx-auto bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl flex flex-col h-[640px]">
                
                {/* Header info */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-400">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-sans">Nebula Infrastructure Co-pilot</h3>
                      <p className="text-xs text-slate-400 font-mono">Prompt engineering models for fine-tuned Docker, Kubernetes, and pipeline setups</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-3 py-1 bg-cyan-950 border border-cyan-805 text-cyan-400 rounded-full">
                    Gemini-3.5-flash AI Hub
                  </span>
                </div>

                {/* Message logs */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 font-sans text-sm mb-6 pb-2" id="chats_scrollpanel">
                  {chatMessages.map((msg, idx) => {
                    const isModel = msg.role === "model";
                    return (
                      <div key={idx} className={`flex ${isModel ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 ${
                          isModel
                            ? "bg-slate-950 border border-slate-850 text-slate-200"
                            : "bg-indigo-600 text-white rounded-br-none"
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            {isModel ? (
                              <Bot className="w-4 h-4 text-cyan-400" />
                            ) : (
                              <Users className="w-4 h-4 text-indigo-200" />
                            )}
                            <span className="text-[10px] font-mono font-bold tracking-wider uppercase opacity-70">
                              {isModel ? "NEBULA CO-PILOT" : "S. PETERSON ARCHITECT"}
                            </span>
                          </div>

                          <div className="whitespace-pre-wrap leading-relaxed prose prose-invert select-text">
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {isAiCopilotLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex items-center gap-3">
                        <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                        <span className="text-xs font-mono text-slate-400">Querying platform intelligence...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick suggestions box */}
                <div className="flex gap-2 overflow-x-auto pb-4 pt-1 font-mono text-[11px] h-12 no-scrollbar">
                  {[
                    "Construct sound Nginx SSL proxy reverse rules",
                    "Scaffold NextJS multi-stage production Dockerfile",
                    "Write Kubernetes deployment config YAML mapping Node.js backend",
                    "Compose basic Ansible script for Rocky Linux system upgrade"
                  ].map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setChatInput(s)}
                      className="px-3 py-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-full text-slate-400 hover:text-slate-200 flex-shrink-0 transition cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Command Input footer */}
                <form onSubmit={handleSendPrompt} className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex items-center gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask co-pilot for Docker, Kubernetes, Terraform blueprints..."
                    className="flex-1 bg-transparent px-3 py-2 border-0 outline-none text-slate-100 text-xs focus:ring-0"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isAiCopilotLoading || !chatInput.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Prompt
                  </button>
                </form>

              </div>

            </div>
          )}

          {/* TAB 6: DOMAINS & SSL LINK */}
          {activeTab === "domains" && (
            <div className="space-y-6 animate-fade-in" id="domains_container">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Domain linker Form */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                      <Globe className="w-5 h-5 text-indigo-400" />
                      Add Custom Domain
                    </h3>
                    <p className="text-xs text-slate-400 mb-6 font-sans">
                      Point external domains to our load balancers. Let's Encrypt certificates generated instantly.
                    </p>

                    <form onSubmit={handleAddDomain} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 font-mono">FQDN Domain Name</label>
                        <input
                          type="text"
                          placeholder="e.g. staging.yourorg.com"
                          value={newDomain}
                          onChange={(e) => setNewDomain(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
                          required
                        />
                      </div>

                      <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2 text-xs font-mono text-slate-400">
                        <p className="text-[10px] font-bold text-indigo-400 mb-1">REQUIRED DNS SETUP:</p>
                        <div className="flex justify-between">
                          <span>A Record:</span>
                          <span className="text-slate-200">104.24.12.189</span>
                        </div>
                        <div className="flex justify-between">
                          <span>CNAME target:</span>
                          <span className="text-slate-200">cname.nebulahost.dev</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-550 active:scale-[0.99] text-white font-bold text-sm py-2.5 rounded-lg cursor-pointer transition shadow-md"
                      >
                        Initiate Nameserver Bind
                      </button>
                    </form>
                  </div>
                </div>

                {/* Linked Domain List Table */}
                <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-850 mb-6">
                    <div>
                      <h3 className="text-base font-bold text-white">Configured Name Routing Pools</h3>
                      <p className="text-xs text-slate-500 font-mono">Domains currently registered and secured with TLS/SSL envelopes</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {domainList.map((d) => (
                      <div key={d.id} className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-4">
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center text-slate-300">
                              <Globe className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-extrabold text-white font-mono">{d.domainName}</h4>
                              <p className="text-[11px] text-slate-500 font-mono">Secured by: {d.sslType}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {d.sslStatus === "active" ? (
                              <span className="text-[10px] bg-emerald-950/40 border border-emerald-900 text-emerald-400 font-mono px-3 py-1 rounded-full flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" /> TLS CERT PASS
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-950/40 border border-amber-900 text-amber-500 font-mono px-3 py-1 rounded-full animate-pulse">
                                INGRESS VALIDATING
                              </span>
                            )}
                            <button
                              onClick={() => {
                                setDomainList(domainList.filter(it => it.id !== d.id));
                              }}
                              className="text-slate-600 hover:text-rose-400 p-2 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* DNS Record details */}
                        <div className="border-t border-slate-900 pt-3">
                          <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Mapped Edge DNS Paths</p>
                          <div className="space-y-1.5">
                            {d.dnsRecords.map((rec, rIdx) => (
                              <div key={rIdx} className="flex justify-between text-xs font-mono bg-slate-900/60 p-2 rounded">
                                <div className="flex items-center gap-2">
                                  <span className="text-indigo-400 font-bold">[{rec.type}]</span>
                                  <span className="text-slate-300">{rec.name}</span>
                                </div>
                                <div className="flex items-center gap-4 text-slate-500">
                                  <span>{rec.value}</span>
                                  {rec.proxied && (
                                    <span className="text-[9px] bg-cyan-950 border border-cyan-900 text-cyan-400 px-1 rounded uppercase">PROXY</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 7: BILLING PLANS & COUPONS */}
          {activeTab === "billing" && (
            <div className="space-y-6 animate-fade-in" id="billing_container">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Coupon widget + estimator */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Estimator details */}
                  <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <h3 className="text-base font-bold text-white mb-2 tracking-wide uppercase font-mono text-slate-400">Workspace Usage Gauge</h3>
                    
                    <div className="space-y-4 mt-4">
                      <div>
                        <div className="flex justify-between text-xs font-mono mb-1 text-slate-400">
                          <span>Compute Bandwidth Pool:</span>
                          <span className="text-white">1.82 TB / 10 TB</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400" style={{ width: "18.2%" }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-mono mb-1 text-slate-400">
                          <span>VPS Dedicated cores uptime:</span>
                          <span className="text-white">184 hrs / Unlimited</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-505 bg-indigo-500" style={{ width: "35%" }}></div>
                        </div>
                      </div>

                      {/* Estimated Billing Charge */}
                      <div className="pt-4 border-t border-slate-900 text-right">
                        <p className="text-xs text-slate-500 font-mono">Current Month Dynamic Toll Rate:</p>
                        <p className="text-3xl font-extrabold text-white tracking-tight mt-1">
                          ${couponApplied ? (selectedPlan === "starter" ? 14 : selectedPlan === "pro" ? 44.5 : 249.5) : (selectedPlan === "starter" ? 29 : selectedPlan === "pro" ? 89 : 499)}
                          <span className="text-xs text-slate-500 font-normal"> / USD</span>
                        </p>
                        {couponApplied && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-900/50 px-2.5 py-0.5 rounded-full inline-block mt-1">
                            CONGRATS! {couponDiscount}% PROMO COUPON DEPOSITED!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Apply Coupon code form */}
                  <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl relative overflow-hidden shadow-2xl">
                    <h4 className="text-sm font-bold font-mono tracking-wider text-slate-300 mb-3">Enterprise Promo & Core Coupons</h4>
                    
                    <form onSubmit={handleApplyCoupon} className="space-y-3">
                      <div>
                        <input
                          type="text"
                          placeholder="e.g. NEBULA_AI_50"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono uppercase text-indigo-300 outline-none focus:border-indigo-400 transition"
                        />
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-xs font-mono font-bold text-slate-200 cursor-pointer"
                      >
                        Query Voucher Database
                      </button>

                      {couponError && <p className="text-[10px] text-rose-400 font-mono mt-1">{couponError}</p>}
                      <div className="bg-slate-950/60 p-2.5 border border-indigo-900/20 rounded-lg text-[11px] font-mono text-indigo-400 mt-2 space-y-1">
                        <p className="font-bold">HINT: Try following tags inside sandbox:</p>
                        <p>• <span className="text-slate-300">NEBULA_AI_50</span> (50% reduction)</p>
                        <p>• <span className="text-slate-300">FREE_DEV_99</span> (99% developer drop)</p>
                      </div>
                    </form>
                  </div>

                </div>

                {/* Sub plans selector */}
                <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-850 mb-6">
                    <div>
                      <h3 className="text-base font-bold text-white">Tier Subscriptions Registry</h3>
                      <p className="text-xs text-slate-500 font-mono">Scale computing limits instantly. Pay on standard monthly cycle.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Plan A */}
                    <div className={`border rounded-2xl p-5 space-y-4 relative overflow-hidden flex flex-col justify-between ${
                      selectedPlan === "starter" ? "bg-indigo-950/30 border-indigo-500 shadow-indigo-950 shadow-lg" : "bg-slate-950 border-slate-850"
                    }`}>
                      <div>
                        <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-indigo-300">SANDBOX</span>
                        <h4 className="text-base font-bold text-white mt-1">Starter Core</h4>
                        <p className="text-xs text-slate-500">Perfect for prototyping AI servers.</p>
                      </div>

                      <div>
                        <p className="text-2xl font-black text-white">$29<span className="text-xs text-slate-500 font-normal"> /mo</span></p>
                        <ul className="text-[11px] text-slate-400 space-y-2 mt-4 font-mono">
                          <li>• 10 Custom Domains</li>
                          <li>• 2 vCPU VPS limits</li>
                          <li>• Standard Build Queues</li>
                          <li>• Basic AI analysis</li>
                        </ul>
                      </div>

                      <button
                        onClick={() => setSelectedPlan("starter")}
                        className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 font-semibold text-xs text-slate-200 mt-4 rounded-lg cursor-pointer transition border border-slate-700"
                      >
                        Select Starter
                      </button>
                    </div>

                    {/* Plan B */}
                    <div className={`border rounded-2xl p-5 space-y-4 relative overflow-hidden flex flex-col justify-between ${
                      selectedPlan === "pro" ? "bg-indigo-950/40 border-indigo-500 shadow-indigo-950 shadow-lg" : "bg-slate-950 border-slate-850"
                    }`}>
                      <div className="absolute top-3 right-3">
                        <span className="text-[9px] bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-800">POPULAR</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono bg-slate-900 border border-slate-805 px-2 py-0.5 rounded text-indigo-300">ENTERPRISE</span>
                        <h4 className="text-base font-bold text-white mt-1">Stellar Pro</h4>
                        <p className="text-xs text-slate-500">Heavy scalable production workloads.</p>
                      </div>

                      <div>
                        <p className="text-2xl font-black text-white">$89<span className="text-xs text-slate-500 font-normal"> /mo</span></p>
                        <ul className="text-[11px] text-slate-305 text-slate-400 space-y-2 mt-4 font-mono">
                          <li className="text-cyan-400">• Unlimited Domains</li>
                          <li>• 8 vCPU VPS limits</li>
                          <li>• High-Freq priority Build</li>
                          <li>• Full Gemini Troubleshoot</li>
                        </ul>
                      </div>

                      <button
                        onClick={() => setSelectedPlan("pro")}
                        className="w-full py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-90 font-semibold text-xs text-white mt-4 rounded-lg cursor-pointer transition"
                      >
                        Set Active Tier
                      </button>
                    </div>

                    {/* Plan C */}
                    <div className={`border rounded-2xl p-5 space-y-4 relative overflow-hidden flex flex-col justify-between ${
                      selectedPlan === "enterprise" ? "bg-indigo-950/30 border-indigo-500 shadow-indigo-950 shadow-lg" : "bg-slate-950 border-slate-850"
                    }`}>
                      <div>
                        <span className="text-[9px] font-mono bg-slate-900 border border-slate-805 px-2 py-0.5 rounded text-indigo-300">CUSTOM</span>
                        <h4 className="text-base font-bold text-white mt-1">Cosmic Core</h4>
                        <p className="text-xs text-slate-500">Billion-dollar startup pipelines.</p>
                      </div>

                      <div>
                        <p className="text-2xl font-black text-white">$499<span className="text-xs text-slate-500 font-normal"> /mo</span></p>
                        <ul className="text-[11px] text-slate-400 space-y-2 mt-4 font-mono">
                          <li>• Custom Bare Metal cluster</li>
                          <li>• Dedicated Core CPU pools</li>
                          <li>• SLA Uptime guarantees</li>
                          <li>• Personal AI DevOps Agent</li>
                        </ul>
                      </div>

                      <button
                        onClick={() => setSelectedPlan("enterprise")}
                        className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 font-semibold text-xs text-slate-200 mt-4 rounded-lg cursor-pointer transition border border-slate-700"
                      >
                        Deploy Custom
                      </button>
                    </div>

                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 8: TEAM OPERATIONS */}
          {activeTab === "teams" && (
            <div className="space-y-6 animate-fade-in" id="teams_container">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Invite Widget */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-400" /> Invite Collaborator
                    </h3>
                    <p className="text-xs text-slate-400 mb-6 font-sans">
                      Provision programmatic sub-keys or panel dashboard access keys to DevOps members.
                    </p>

                    <form onSubmit={handleCreateTeamInvite} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 font-mono">Full Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Elena Rostova"
                          value={inviteName}
                          onChange={(e) => setInviteName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 font-mono">Email Target</label>
                        <input
                          type="email"
                          placeholder="elena@company.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 font-mono">Authorization Level</label>
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-400 font-mono text-indigo-300"
                        >
                          <option value="Developer">Developer (Read/Write Deployments)</option>
                          <option value="Analyst">Analyst (Resource Graph Audit)</option>
                          <option value="Billing">Billing (Invoices & Tier Control)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-xs py-3 rounded-lg cursor-pointer transition shadow-md"
                      >
                        Dispatch Invitations Key
                      </button>
                    </form>
                  </div>
                </div>

                {/* Team roster + Audit logs */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Member Table */}
                  <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
                    <h3 className="text-base font-bold text-white mb-4">Workspace Roster</h3>
                    
                    <div className="space-y-3">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-300 flex items-center justify-center">
                              {member.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-slate-100 font-mono">{member.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{member.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-3 py-0.5 rounded font-mono select-none">
                              {member.role}
                            </span>
                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                              member.status === "Active" ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900" : "bg-amber-950/30 text-amber-500 border border-amber-900 animate-pulse"
                            }`}>
                              {member.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Audit Logs */}
                  <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
                    <h3 className="text-base font-bold text-slate-400 font-mono uppercase tracking-widest mb-4">Security Access Chronicle (Audit)</h3>
                    
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="flex justify-between items-center text-[11px] font-mono bg-slate-950/50 p-2 border border-slate-900 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-400 font-bold">[{log.action}]</span>
                            <span className="text-slate-300">{log.actor} on {log.target}</span>
                          </div>
                          <span className="text-slate-500">{log.timestamp} • IP: {log.ip}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 9: PLATFORM CORE ADMINISTRATION */}
          {activeTab === "admin" && (
            <div className="space-y-6 animate-fade-in" id="admin_matrix_panel">
              
              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-850 mb-6 gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">Global Node Telemetry Diagnostics</h2>
                    <p className="text-xs text-slate-500">System administrators mainframe telemetry database. Core CPU and dynamic memory status.</p>
                  </div>
                  <span className="text-[10px] font-mono bg-indigo-950 border border-indigo-900 text-indigo-400 px-3 py-1 rounded">
                    MAIN GATEWAY CORE HEALTHY
                  </span>
                </div>

                {/* Nodes statistics grids */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { node: "us-east-1 (Virginia)", uptime: "99.9992%", load: "32% cores", speed: "12ms ping", r: "NOMINAL" },
                    { node: "eu-central-1 (Frankfurt)", uptime: "99.9984%", load: "55% cores", speed: "28ms ping", r: "NOMINAL" },
                    { node: "ap-south-1 (Mumbai)", uptime: "99.9912%", load: "18% cores", speed: "84ms ping", r: "NOMINAL" },
                    { node: "sa-east-1 (São Paulo)", uptime: "99.4215%", load: "12% cores", speed: "115ms ping", r: "DEGRADED" }
                  ].map((x, idx) => (
                    <div key={idx} className="bg-slate-950/80 border border-slate-850 rounded-xl p-4 space-y-2 relative overflow-hidden">
                      <p className="text-xs font-mono font-bold text-slate-200">{x.node}</p>
                      
                      <div className="text-[11px] font-mono text-slate-400 space-y-1">
                        <p>Uptime: <span className="text-slate-200">{x.uptime}</span></p>
                        <p>Load: <span className="text-slate-200">{x.load}</span></p>
                        <p>Latency: <span className="text-slate-200">{x.speed}</span></p>
                      </div>

                      <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded absolute top-2 right-2 ${
                        x.r === "NOMINAL" ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900" : "bg-rose-955 bg-rose-950/40 text-rose-400 border border-rose-900 animate-pulse"
                      }`}>
                        {x.r}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Multi-tenant infrastructure metrics list */}
                <div className="mt-8 space-y-4">
                  <h3 className="text-sm font-mono font-bold text-slate-400 uppercase tracking-widest">Active System Schedulers</h3>
                  <div className="bg-slate-950/50 p-4 border border-slate-850 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                      <span>Global DNS Load Balancer (Round-Robin IP pool)</span>
                      <span className="text-emerald-400">ACTIVE</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                      <span>Edge Caching Proxy Core (98% CACHE_HIT target)</span>
                      <span className="text-emerald-400">NOMINAL</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                      <span>TLS Let's Encrypt renewal schedule cron</span>
                      <span className="text-emerald-400">WAITING</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Global Footer Navigation Indicator - floating frosted block */}
        <div className="sticky bottom-6 mx-auto bg-slate-950/70 border border-slate-800/60 backdrop-blur-3xl px-6 py-2.5 rounded-2xl flex items-center gap-6 shadow-2xl z-40 my-3 select-none text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            <span className="text-slate-300 uppercase tracking-widest text-[10px]">MAIN MAINFRAME ACTIVE</span>
          </div>

          <div className="h-4 w-px bg-slate-800"></div>

          <div className="text-slate-500 uppercase tracking-widest text-[9px] hidden sm:inline">
            Node status: TOKYO-NW-04
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:inline"></div>

          <span className="text-slate-400">
            v4.2.0-STABLE
          </span>
        </div>

      </main>

    </div>
  );
}
