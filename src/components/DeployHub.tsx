import React, { useState } from "react";
import { Terminal, Github, Bot, RefreshCw, Cpu, CheckCircle2, XCircle, AlertTriangle, Play, Sparkles, Copy, Check } from "lucide-react";
import { Deployment } from "../types";

const INITIAL_DEPLOYMENTS: Deployment[] = [
  {
    id: "dep-101",
    name: "nebula-gateway",
    framework: "nextjs",
    repo: "github.com/nebulahost/nebula-gateway-api",
    branch: "main",
    status: "active",
    url: "https://nebula-gateway.live.nebulahost.dev",
    createdAt: "2026-05-20T10:15:00Z",
    lastBuildLog: [
      "[info] Launching build container node:18-alpine...",
      "[info] Resolving package dependencies...",
      "[info] Running task: npx next build",
      "[warning] Found deprecated library references (React-19 legacy shim).",
      "[info] Creating an optimized production build...",
      "[info] Compile static HTML files complete.",
      "[info] Deploy succeeded to US-East-1 Edge Container pool."
    ]
  },
  {
    id: "dep-102",
    name: "auth-daemon",
    framework: "nodejs",
    repo: "github.com/nebulahost/security-auth-daemon",
    branch: "auth-v2",
    status: "failed",
    createdAt: "2026-05-22T08:31:00Z",
    lastBuildLog: [
      "[info] Initializing docker stack build-step...",
      "[info] Installing production modules...",
      "[error] MODULE_NOT_FOUND: Cannot find module '@google/genai' inside server.ts",
      "[error] Failed at task: compiling files compiling type check.",
      "[fatal] Exit code (1) generated. Tearing down builder instance node-21."
    ]
  }
];

export default function DeployHub() {
  const [deployments, setDeployments] = useState<Deployment[]>(INITIAL_DEPLOYMENTS);
  const [selectedDep, setSelectedDep] = useState<Deployment | null>(INITIAL_DEPLOYMENTS[1]);
  const [newAppName, setNewAppName] = useState("");
  const [newRepo, setNewRepo] = useState("github.com/nebulahost/stellar-client");
  const [selectedFramework, setSelectedFramework] = useState<Deployment["framework"]>("react");
  const [isBuilding, setIsBuilding] = useState(false);
  const [customErrorLog, setCustomErrorLog] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [copiedState, setCopiedState] = useState<string | null>(null);

  const handleCopy = (txt: string, key: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedState(key);
    setTimeout(() => setCopiedState(null), 2000);
  };

  const startNewDeployment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName) return;

    setIsBuilding(true);
    let buildLogsList = [
      `[info] Initializing custom ${selectedFramework} deploy process...`,
      `[info] Mapping git source repository: ${newRepo}...`,
      "[info] Cloning environment manifest branch: main...",
      "[info] Allocating high-frequency container builder core pod-301..."
    ];

    setTimeout(() => {
      // Simulate build completion
      setIsBuilding(false);
      const newDep: Deployment = {
        id: `dep-${Math.floor(Math.random() * 900) + 100}`,
        name: newAppName.toLowerCase().replace(/\s+/g, "-"),
        framework: selectedFramework,
        repo: newRepo,
        branch: "main",
        status: "active",
        url: `https://${newAppName.toLowerCase().replace(/\s+/g, "-")}.nebulahost.dev`,
        createdAt: new Date().toISOString(),
        lastBuildLog: [
          ...buildLogsList,
          `[info] Dynamic auto-detection: found ${selectedFramework} configuration.`,
          "[info] Generating production bundle configurations...",
          "[info] Bundle compression completed: 1.48 MB.",
          `[info] Container deployed successfully! Domain https://${newAppName.toLowerCase().replace(/\s+/g, "-")}.nebulahost.dev is now active.`
        ]
      };
      setDeployments([newDep, ...deployments]);
      setSelectedDep(newDep);
      setNewAppName("");
    }, 3500);
  };

  const triggerAITroubleshoot = async (logString: string, fw: string) => {
    setAiLoading(true);
    setAiAnalysis("");
    try {
      const response = await fetch("/api/ai/troubleshoot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          log: logString,
          framework: fw,
          context: { buildTime: new Date().toISOString() }
        })
      });
      const data = await response.json();
      if (data.analysis) {
        setAiAnalysis(data.analysis);
      } else if (data.simulation) {
        // Fallback response for mock simulation mode
        const analysisText = `### 🌋 NebulaHost AI Analysis
#### **Issue Summary**
${data.summary}

#### **Explanation**
${data.explanation}

#### **Recommended Solution**
${data.fix}

#### **Suggested Manifest Update:**
\`\`\`json
${data.suggestedConfig}
\`\`\`
`;
        setAiAnalysis(analysisText);
      } else {
        setAiAnalysis("Unrecognized payload received from Nebula AI Core.");
      }
    } catch (err: any) {
      setAiAnalysis(`### ❌ AI Engine Error\nUnable to reach AI DevOps endpoint: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCustomTroubleshootSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customErrorLog) return;
    triggerAITroubleshoot(customErrorLog, "unknown");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-100" id="deploy_hub_root">
      {/* Deploy Section */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl" id="creation_unit">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <h2 className="text-xl font-bold font-sans tracking-tight mb-4 flex items-center gap-2 text-cyan-400">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            Instant Deployment
          </h2>
          <p className="text-sm text-slate-400 mb-6 font-sans">
            Connect your Git repository, pick your framework setup, and deploy instantly to our worldwide cluster network.
          </p>

          <form onSubmit={startNewDeployment} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">App Identifier</label>
              <input
                type="text"
                placeholder="e.g. nebula-dashboard"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">Repository URI</label>
              <div className="relative">
                <Github className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="github.com/user/project"
                  value={newRepo}
                  onChange={(e) => setNewRepo(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition font-mono text-slate-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 font-mono">Select Cloud Framework</label>
              <div className="grid grid-cols-3 gap-2">
                {(["react", "nextjs", "nodejs", "python", "golang", "docker"] as const).map((fw) => (
                  <button
                    key={fw}
                    type="button"
                    onClick={() => setSelectedFramework(fw)}
                    className={`py-2 px-1 border rounded-lg text-xs capitalize font-sans transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      selectedFramework === fw
                        ? "bg-slate-800/60 border-cyan-400 text-cyan-400 font-medium shadow-cyan-950 shadow-md"
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-[10px] opacity-75 uppercase font-mono">{fw}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isBuilding}
              className="w-full bg-cyan-650 bg-cyan-600 hover:bg-cyan-550 active:scale-[0.99] hover:shadow-cyan-900/30 text-white py-3 rounded-lg text-sm font-semibold transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {isBuilding ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  Building Cluster Stack...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white animate-pulse" />
                  Deploy Instant Build
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing Deployments List */}
        <div className="bg-slate-900/40 border border-slate-800/65 rounded-2xl p-6 backdrop-blur-xl shadow-2xl" id="services_directory">
          <h3 className="text-base font-bold font-sans tracking-wide mb-3 uppercase text-slate-450 text-slate-400 font-mono">Active Clusters Directory</h3>
          <div className="space-y-3">
            {deployments.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDep(d)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col relative overflow-hidden cursor-pointer ${
                  selectedDep?.id === d.id
                    ? "bg-slate-804 bg-indigo-950/35 border-cyan-500/50"
                    : "bg-slate-950/45 border-slate-800 hover:bg-slate-900/40 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm tracking-tight text-slate-200 flex items-center gap-1.5 font-mono">
                    {d.name}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 text-xs uppercase border border-slate-800">{d.framework}</span>
                  </span>
                  {d.status === "active" ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                      ACTIVE
                    </span>
                  ) : d.status === "failed" ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 bg-rose-950/40 border border-rose-800 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span>
                      FAILED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800 px-2 py-0.5 rounded-full">
                      BUILDING
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500 truncate font-mono">{d.repo}</span>
                {d.url && (
                  <span className="text-[11px] text-cyan-400/85 hover:underline mt-2 truncate font-mono">{d.url}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Terminal logs and Troubleshooter diagnostics */}
      <div className="lg:col-span-8 space-y-6">
        {selectedDep && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl" id="terminal_console_frame">
            <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-sm font-sans tracking-tight text-slate-200">
                    Engine Log Stream {selectedDep.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Ref: {selectedDep.id} | Branch: {selectedDep.branch}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedDep.status === "failed" && (
                  <button
                    onClick={() => triggerAITroubleshoot(selectedDep.lastBuildLog.join("\n"), selectedDep.framework)}
                    disabled={aiLoading}
                    className="bg-yellow-600/25 hover:bg-yellow-600/35 border border-yellow-500/50 text-yellow-300 font-sans px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-55"
                  >
                    <Bot className="w-4 h-4" />
                    {aiLoading ? "Consulting AI..." : "AI Troubleshoot"}
                  </button>
                )}
                <span className="text-xs text-slate-500 font-mono">UTC Log</span>
              </div>
            </div>

            <div className="bg-slate-950 p-6 font-mono text-xs text-slate-300 space-y-2 h-[260px] overflow-y-auto leading-relaxed border-b border-slate-900">
              {selectedDep.lastBuildLog.map((log, index) => {
                const isError = log.includes("[error]") || log.includes("[fatal]");
                const isWarning = log.includes("[warning]");
                return (
                  <p
                    key={index}
                    className={`${isError ? "text-rose-400 bg-rose-950/20 px-2 py-0.5 rounded border-l-2 border-rose-500" : isWarning ? "text-yellow-400 bg-yellow-950/20 px-2 py-0.5 rounded border-l-2 border-yellow-500" : "text-emerald-300/90"}`}
                  >
                    {log}
                  </p>
                );
              })}
            </div>
            
            <div className="p-4 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Infrastructure Node v20.12.0
              </span>
              <span className="font-mono">IP: 104.24.12.189</span>
            </div>
          </div>
        )}

        {/* AI Diagnostics Panel */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-2xl" id="ai_diagnostics_panel">
          <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
            <h3 className="font-sans font-extrabold text-lg flex items-center gap-2.5 text-white">
              <span className="p-2 rounded-lg bg-cyan-950 border border-cyan-800">
                <Bot className="w-5 h-5 text-cyan-400" />
              </span>
              Nebula AI DevOps Diagnostician
            </h3>
            <span className="font-mono text-xs bg-slate-950 px-3 py-1 border border-slate-800 text-cyan-400 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></span>
              Core engine active
            </span>
          </div>

          {!aiAnalysis && !aiLoading && (
            <div className="text-center py-8 text-slate-400">
              <Bot className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-sm font-medium mb-1 text-slate-300">No active telemetry investigations yet.</p>
              <p className="text-xs text-slate-500 max-w-lg mx-auto">
                Select the failed <code className="text-slate-300 bg-slate-950 px-1 py-0.5 rounded font-mono">auth-daemon</code> deployment above and click <span className="text-yellow-400 font-semibold font-mono">AI Troubleshoot</span> to trigger live model troubleshooting on the server.
              </p>

              {/* Simulation Sandbox Trigger */}
              <div className="mt-6 p-4 border border-slate-800 bg-slate-950/60 rounded-xl max-w-xl mx-auto text-left">
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950 border border-cyan-900 px-2 py-0.5 rounded font-mono uppercase tracking-widest mb-2 inline-block">Sandbox Error Tester</span>
                <form onSubmit={handleCustomTroubleshootSubmit} className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Or input custom build CLI errors or container crash logs below to analyze:
                  </p>
                  <textarea
                    rows={2}
                    placeholder="e.g. error: dockerfile instruction 'RUN npm build' failed with code 127"
                    value={customErrorLog}
                    onChange={(e) => setCustomErrorLog(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-300 outline-none focus:border-cyan-400 transition"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!customErrorLog || aiLoading}
                      className="px-4 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 hover:bg-slate-700 cursor-pointer disabled:opacity-50"
                    >
                      Diagnose Error Paste
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {aiLoading && (
            <div className="py-12 text-center text-slate-400 bg-slate-950/40 rounded-xl space-y-4">
              <div className="relative w-12 h-12 mx-auto">
                <div className="w-12 h-12 rounded-full border-2 border-cyan-800 border-t-cyan-400 animate-spin"></div>
                <Bot className="w-6 h-6 text-cyan-400 absolute top-3 left-3 animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-200">Analyzing build crash trace logs...</p>
                <p className="text-xs text-slate-500 animate-pulse font-mono">Interrogating server-side Gemini-3.5-flash...</p>
              </div>
            </div>
          )}

          {aiAnalysis && !aiLoading && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 font-sans relative">
              <button
                onClick={() => handleCopy(aiAnalysis, "cli")}
                className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 p-1.5 rounded text-xs text-slate-400 transition flex items-center gap-1 cursor-pointer"
                title="Copy markdown diagnostic output"
              >
                {copiedState === "cli" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[10px] font-mono">{copiedState === "cli" ? "Copied" : "Copy"}</span>
              </button>

              <div className="prose prose-invert max-w-none text-slate-300 text-sm space-y-4 leading-relaxed">
                {/* Parse Markdown representation */}
                {aiAnalysis.split("\n\n").map((chunk, cIdx) => {
                  if (chunk.startsWith("###")) {
                    return <h4 key={cIdx} className="text-base font-bold text-cyan-400 font-mono tracking-tight mt-4 pt-2 border-b border-slate-800">{chunk.replace("###", "").trim()}</h4>;
                  }
                  if (chunk.startsWith("####")) {
                    return <h5 key={cIdx} className="text-sm font-bold text-purple-400 font-sans tracking-wide mt-3">{chunk.replace("####", "").trim()}</h5>;
                  }
                  if (chunk.startsWith("```")) {
                    const code = chunk.replace(/```[a-z]*/g, "").trim();
                    return (
                      <pre key={cIdx} className="bg-slate-950 p-4 border border-slate-800 rounded-lg text-xs text-emerald-300 font-mono overflow-x-auto my-3 relative leading-5">
                        <code>{code}</code>
                      </pre>
                    );
                  }
                  return <p key={cIdx} className="text-slate-300 leading-relaxed font-sans">{chunk}</p>;
                })}
              </div>

              {/* Actions Footer */}
              <div className="mt-6 pt-4 border-t border-slate-900 flex justify-end">
                <button
                  onClick={() => {
                    setAiAnalysis("");
                    setCustomErrorLog("");
                  }}
                  className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-xs hover:bg-slate-800 transition cursor-pointer text-slate-300"
                >
                  Clear Diagnostics Review
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
