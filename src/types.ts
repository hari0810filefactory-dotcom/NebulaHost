export interface EdgeNode {
  id: string;
  name: string;
  status: "healthy" | "congested" | "degraded";
  rtt: string;
  load: number;
  cpu: number;
  ram: number;
  bandwidth: string;
}

export interface Deployment {
  id: string;
  name: string;
  framework: "react" | "nextjs" | "nodejs" | "python" | "golang" | "docker";
  repo: string;
  branch: string;
  status: "active" | "building" | "failed" | "idle";
  url?: string;
  createdAt: string;
  lastBuildLog: string[];
}

export interface VPSInstance {
  id: string;
  name: string;
  os: "ubuntu" | "debian" | "alpine" | "rocky";
  region: string;
  ip: string;
  status: "running" | "stopped" | "rebooting";
  specs: {
    vcpu: number;
    ram: number;
    storage: number;
  };
  firewalls: { port: number; protocol: "TCP" | "UDP"; allowed: string }[];
  backups: { date: string; size: string; status: string }[];
  alerts?: {
    cpuThreshold: number;
    ramThreshold: number;
    email: string;
    enabled: boolean;
    alertType?: "Immediate" | "Delayed";
    smartNotification?: boolean;
  };
  project?: string;
  tags?: string[];
}

export interface K8sCluster {
  id: string;
  name: string;
  replicas: number;
  pods: { name: string; status: "Running" | "Pending" | "Failed"; container: string; logs: string[] }[];
  autoscaling: { enabled: boolean; min: number; max: number; targetCpu: number };
}

export interface ConnectedDomain {
  id: string;
  domainName: string;
  sslType: "LetsEncrypt" | "Cloudflare" | "Custom";
  sslStatus: "active" | "expiring" | "pending";
  dnsRecords: { type: "A" | "AAAA" | "CNAME" | "TXT"; name: string; value: string; proxied: boolean }[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Developer" | "Analyst" | "Billing";
  status: "Active" | "Pending";
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  ip: string;
}

export interface Invoice {
  id: string;
  billingPeriod: string;
  amount: number;
  status: "paid" | "pdf_download";
}

export interface InfrastructureStats {
  nodes: EdgeNode[];
  systemMetrics: {
    globalUptime: string;
    activeContainers: number;
    totalMemoryUsage: string;
    totalCpuUsage: string;
    networkIn: string;
    networkOut: string;
  };
}
