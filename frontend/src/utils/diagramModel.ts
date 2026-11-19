import type { ArchitectureDiagramData } from "../types/diagram";

export const defaultDiagram: ArchitectureDiagramData = {
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
};

function nodeText(node: any): string {
  if (typeof node?.text === "string") return node.text;
  return Array.isArray(node?.content) ? node.content.map(nodeText).join("") : "";
}

export function normalizeDiagramDocument(document: any) {
  if (!document || document.type !== "doc" || !Array.isArray(document.content)) return document;
  const content = document.content.map((node: any) => {
    if (node.type !== "paragraph") return node;
    const text = nodeText(node).trim().toUpperCase();
    if (!text.startsWith("CLIENT / WEB BROWSER") || !text.includes("TIDB CLOUD DATABASE")) return node;
    return { type: "architectureDiagram", attrs: structuredClone(defaultDiagram) };
  });
  return { ...document, content };
}
