export const defaultDocument = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Why We Chose PaaS Over IaaS: Understanding the Shared Responsibility Model" }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Introduction to Cloud Computing" }] },
    { type: "paragraph", content: [{ type: "text", text: "Cloud computing provides on-demand access to computing resources over the internet. Cloud service models matter because they set different boundaries for operational responsibility, cost, and development speed. Selecting an appropriate model helps a web application team balance control with manageable maintenance. This reflection compares Infrastructure as a Service (IaaS) and Platform as a Service (PaaS)." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Understanding IaaS and PaaS" }] },
    { type: "paragraph", content: [{ type: "text", text: "IaaS provides virtualized infrastructure such as servers, storage, networking, and core computing resources. The provider manages physical infrastructure and virtualization, while the customer manages more of the software environment, including the operating system, runtime, application, and data." }] },
    { type: "paragraph", content: [{ type: "text", text: "PaaS provides a managed platform for developing, running, and deploying applications. The provider manages underlying infrastructure and much of the managed application platform, allowing developers to focus on application logic and application data." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Shared Responsibility Model" }] },
    { type: "paragraph", content: [{ type: "text", text: "The Shared Responsibility Model defines which controls belong to the cloud provider and which remain with the customer or developer. Exact boundaries depend on the provider and service configuration." }] },
    { type: "table", content: [
      { type: "tableRow", content: [{ type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Responsibility" }] }] }, { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "IaaS" }] }] }, { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "PaaS" }] }] }] },
      ...[
        ["Physical Infrastructure", "Provider", "Provider"],
        ["Networking", "Provider infrastructure; customer configuration", "Provider platform and infrastructure"],
        ["Virtualization", "Provider", "Provider"],
        ["Operating System", "Customer", "Provider"],
        ["Middleware / Runtime", "Customer", "Provider-managed platform/runtime"],
        ["Application Code", "Customer", "Customer"],
        ["Application Data", "Customer", "Customer"]
      ].map((row) => ({ type: "tableRow", content: row.map((cell) => ({ type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: cell }] }] })) }))
    ] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Why We Chose PaaS Over IaaS" }] },
    { type: "orderedList", attrs: { start: 1 }, content: [
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Reduced infrastructure management: the team does not independently maintain the operating system and application runtime." }] }] },
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Simplified deployment: a managed platform makes it easier to deploy and host a web application." }] }] },
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Development focus: more time can be spent on application functionality and database integration." }] }] },
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Practical for student projects: PaaS provides necessary hosting without extensive infrastructure administration." }] }] },
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Easier maintenance: the cloud platform handles many underlying infrastructure and platform responsibilities." }] }] }
    ] },
    { type: "paragraph", content: [{ type: "text", text: "Choosing PaaS does not eliminate developer responsibility. We remain responsible for application code, application data, appropriate application configuration, and application security." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "System Architecture" }] },
    {
      type: "architectureDiagram",
      attrs: {
        nodes: [
          { id: "browser", type: "architecture", position: { x: 290, y: 0 }, data: { title: "CLIENT / WEB BROWSER", description: "Application user" } },
          { id: "render", type: "architecture", position: { x: 290, y: 115 }, data: { title: "RENDER (PaaS)", description: "Managed application platform" } },
          { id: "frontend", type: "architecture", position: { x: 0, y: 250 }, data: { title: "React + TypeScript Frontend", description: "Client application" } },
          { id: "backend", type: "architecture", position: { x: 290, y: 250 }, data: { title: "Node.js + Express + TypeScript Backend", description: "Application services" } },
          { id: "api", type: "architecture", position: { x: 580, y: 250 }, data: { title: "REST API", description: "HTTP communication" } },
          { id: "tidb", type: "architecture", position: { x: 290, y: 390 }, data: { title: "TIDB CLOUD DATABASE", description: "MySQL-compatible managed database" } }
        ],
        edges: [
          { id: "browser-render", source: "browser", target: "render", type: "smoothstep", markerEnd: { type: "arrowclosed" } },
          { id: "render-frontend", source: "render", target: "frontend", type: "smoothstep", markerEnd: { type: "arrowclosed" } },
          { id: "render-backend", source: "render", target: "backend", type: "smoothstep", markerEnd: { type: "arrowclosed" } },
          { id: "frontend-api", source: "frontend", target: "api", type: "smoothstep", markerEnd: { type: "arrowclosed" } },
          { id: "backend-api", source: "backend", target: "api", type: "smoothstep", markerEnd: { type: "arrowclosed" } },
          { id: "api-tidb", source: "api", target: "tidb", type: "smoothstep", markerEnd: { type: "arrowclosed" } }
        ]
      }
    },
    { type: "paragraph", content: [{ type: "text", text: "The browser communicates with the application through the REST API. The Express backend validates requests and retrieves or stores document and revision data in the TiDB Cloud database." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Conclusion" }] },
    { type: "paragraph", content: [{ type: "text", text: "PaaS is appropriate for this project because it reduces infrastructure administration while preserving control over application code and data. Understanding the Shared Responsibility Model clarified that PaaS shifts platform operations to the provider but does not transfer all application security or data responsibilities." }] }
  ]
};

export function upgradeLegacyArchitectureDocument(document: any) {
  if (!document || document.type !== "doc" || !Array.isArray(document.content)) return document;
  const defaultDiagramNode = defaultDocument.content.find((node: any) => node.type === "architectureDiagram") as any;
  const content = document.content.map((node: any) => {
    if (node.type !== "paragraph") return node;
    const text = plainTextFromDocument({ type: "doc", content: [node] }).toUpperCase();
    if (!text.startsWith("CLIENT / WEB BROWSER") || !text.includes("TIDB CLOUD DATABASE")) return node;
    return structuredClone(defaultDiagramNode);
  });
  return { ...document, content };
}

export function plainTextFromDocument(doc: any): string {
  const walk = (node: any): string => {
    if (node?.type === "text") return node.text || "";
    if (node?.type === "hardBreak") return "\n";
    if (node?.type === "architectureDiagram") {
      return `System architecture: ${(node.attrs?.nodes || []).map((item: any) => item.data?.title).join(", ")}`;
    }
    if (!Array.isArray(node?.content)) return "";
    const children = node.content.map(walk);
    switch (node.type) {
      case "doc": return children.join("\n\n");
      case "paragraph":
      case "heading": return children.join("");
      case "table": return children.join("\n");
      case "tableRow": return children.join(" | ");
      case "tableCell":
      case "tableHeader": return children.join("");
      case "bulletList":
      case "orderedList": return children.join("\n");
      case "listItem": return `• ${children.join("")}`;
      default: return children.join("");
    }
  };
  return walk(doc).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
