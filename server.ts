import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

// Lazy-initialized Gemini client with telemetry header
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined. AI functions will run in simulation mode.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY_FOR_LINT_SAFETY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ----------------------------------------------------
  // API Routes
  // ----------------------------------------------------

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "online",
      platform: "NebulaHost Engine v3.5",
      timestamp: new Date().toISOString()
    });
  });

  // Host info and simulated metrics for global edge nodes
  app.get("/api/infrastructure", (req, res) => {
    res.json({
      nodes: [
        { id: "us-east-1", name: "US East (N. Virginia)", status: "healthy", rtt: "12ms", load: 42, cpu: 32, ram: 58, bandwidth: "7.2 Gbps" },
        { id: "eu-central-1", name: "EU Central (Frankfurt)", status: "healthy", rtt: "28ms", load: 68, cpu: 55, ram: 74, bandwidth: "9.1 Gbps" },
        { id: "ap-south-1", name: "AP South (Mumbai)", status: "healthy", rtt: "84ms", load: 24, cpu: 18, ram: 41, bandwidth: "4.8 Gbps" },
        { id: "sa-east-1", name: "SA East (São Paulo)", status: "healthy", rtt: "115ms", load: 15, cpu: 12, ram: 30, bandwidth: "2.1 Gbps" }
      ],
      systemMetrics: {
        globalUptime: "99.998%",
        activeContainers: 4892,
        totalMemoryUsage: "64.2%",
        totalCpuUsage: "41.8%",
        networkIn: "142.8 Gbps",
        networkOut: "189.4 Gbps"
      }
    });
  });

  // AI Troubleshooter Endpoint
  app.post("/api/ai/troubleshoot", async (req, res) => {
    const { log, framework, context } = req.body;
    if (!log) {
      return res.status(400).json({ error: "Log content is required" });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      // Elegant simulation fallback if API key is not configured yet
      return res.json({
        simulation: true,
        summary: `Compilation error identified inside the ${framework || "NodeJS"} builder cycle.`,
        explanation: "The build engine failed because an imported dependency was either not declared in your dependencies tree, or there is an incompatible Node runtime version assigned to the current active environment container cluster.",
        fix: "1. Update your configuration to force Node v18+.\n2. Ensure all imports are added to packaging manifests.\n3. Make sure typescript targets correspond with target libraries.",
        suggestedConfig: `{\n  "engines": {\n    "node": ">=18.0.0"\n  }\n}`
      });
    }

    try {
      const client = getGeminiClient();
      const prompt = `You are the lead NebulaHost AI DevOps Architect. A deployable containerized cluster has experienced a build-time crash.
Analyze the following deployment crash log and environment setup and provide:
1. A concise markdown Summary of the issue.
2. A detailed Explanation of why it crashed.
3. Code changes or Actionable fixes.
4. Suggested Config modification if any (e.g., package.json, Dockerfile or next.config.ts).

Keep responses professional, cinematic, and DevOps-expert oriented. Format your reply to have distinct markdown sections.

[FRAMEWORK]: ${framework || "Unknown/Multi-stack"}
[ENVIRONMENT CONTEXT]: ${JSON.stringify(context || {})}
[BUILD CRASH LOG]:
${log}
`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({
        simulation: false,
        analysis: response.text
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to query Gemini AI" });
    }
  });

  // AI Resource & Predictive Scaling Analyst
  app.post("/api/ai/predict-scaling", async (req, res) => {
    const { metrics, clusterInfo } = req.body;
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      return res.json({
        simulation: true,
        recommendation: "AUTO_SCALE_UPSHIFT",
        intensity: "MODERATE",
        reasoning: "Current average CPU utilization is at 74% with concurrent connection spikes over EU-Central-1 edge servers. AI predicts resource exhaustion within the next 4 hours during evening transit workloads.",
        blueprint: "Increase replica set from 3 to 5 nodes. Provision secondary node pool with high CPU performance.",
        confidence: "91%"
      });
    }

    try {
      const client = getGeminiClient();
      const prompt = `You are the NebulaHost AI Platform Optimizer. Given the current usage metrics and cluster state, analyze historical loads, foresee potential spikes, and issue a scaling recommendation dictionary.
Metrics payload: ${JSON.stringify(metrics)}
Cluster overview: ${JSON.stringify(clusterInfo)}

Format your output STRICTLY as a JSON object matching this structure:
{
  "recommendation": "SCALE_UP" | "SCALE_DOWN" | "KEEP_STEADY",
  "intensity": "CRITICAL" | "MODERATE" | "STABLE",
  "reasoning": "Detailed technical analysis string of why",
  "blueprint": "Kubernetes autoscale manifest suggestions or replica adjustment commands",
  "confidence": "Percentage string"
}
`;
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      res.json({ simulation: false, ...parsed });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to analyze scaling" });
    }
  });

  // AI Shell Assistant for generating code, dockerfiles or pipeline configs
  app.post("/api/ai/shell-assistant", async (req, res) => {
    const { history, currentMessage, techStack } = req.body;
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      return res.json({
        simulation: true,
        message: "I am ready to help you construct custom Kubernetes, Docker, Terraform, or CI/CD pipelines! Please supply a Gemini API Key via the Secrets panel to activate full intelligence. In the meantime, here is a premium sample Dockerfile for a optimized multi-stage React/Next server:\n\n```dockerfile\n# Stage 1: Build\nFROM node:18-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\n# Stage 2: Serve\nFROM node:18-alpine AS runner\nWORKDIR /app\nENV NODE_ENV=production\nCOPY --from=builder /app/.next ./.next\nCOPY --from=builder /app/node_modules ./node_modules\nCOPY --from=builder /app/package.json ./package.json\nEXPOSE 3000\nCMD [\"npm\", \"start\"]\n```"
      });
    }

    try {
      const client = getGeminiClient();
      const chatHistory = (history || []).map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }]
      }));

      // Add system context
      const chat = client.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: `You are the lead engineering co-pilot at NebulaHost, an elite futuristic cloud hosting ecosystem.
You generate production-ready Dockerfiles, Kubernetes YAML configs, Terraform files, Nginx reverse proxies, and solve architectural queries.
Provide gorgeous, concise, secure, enterprise-grade, highly commented code setups. Always speak in a professional, cool, state-of-the-art tech assistant persona.`
        },
        history: chatHistory
      });

      const response = await chat.sendMessage({ message: currentMessage || "Suggest a standard Docker configuration for a Node service." });
      res.json({
        simulation: false,
        message: response.text
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to chat with Shell assistant" });
    }
  });

  // ----------------------------------------------------
  // Vite Integration & Asset Serving
  // ----------------------------------------------------

  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind exclusively to 0.0.0.0 and port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[NebulaHost Server] Online and running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server startup crash:", err);
});
