import type { ReactNode } from "react";
import ArchitectureDiagram from "../components/ArchitectureDiagram";
import type { ArchitectureDiagramData } from "../types/diagram";
import { defaultDiagram } from "./diagramModel";

const sectionIds: Record<string, string> = {
  "introduction to cloud computing": "introduction",
  "understanding iaas and paas": "models",
  "shared responsibility model": "responsibility",
  "why we chose paas over iaas": "why-paas",
  "system architecture": "architecture",
  conclusion: "conclusion"
};

function getNodeText(node: any): string {
  if (typeof node?.text === "string") return node.text;
  return Array.isArray(node?.content) ? node.content.map(getNodeText).join("") : "";
}

function renderInline(node: any): ReactNode {
  if (node.type === "text") {
    let content: ReactNode = node.text;
    for (const mark of node.marks || []) {
      if (mark.type === "bold") content = <strong>{content}</strong>;
      if (mark.type === "italic") content = <em>{content}</em>;
      if (mark.type === "underline") content = <u>{content}</u>;
    }
    return content;
  }
  if (node.type === "hardBreak") return <br />;
  return null;
}

export function renderDocument(doc: any): ReactNode {
  const renderNode = (node: any, key: number): ReactNode => {
    const inline = () => node.content?.map((n: any, i: number) => <span key={i}>{renderInline(n)}</span>);
    switch (node.type) {
      case "paragraph":
        if (getNodeText(node).trim().toUpperCase().startsWith("CLIENT / WEB BROWSER") &&
            getNodeText(node).toUpperCase().includes("TIDB CLOUD DATABASE")) {
          return <ArchitectureDiagram key={key} diagram={defaultDiagram} />;
        }
        return <p key={key} style={{ textAlign: node.attrs?.textAlign }}>{inline()}</p>;
      case "heading":
        const level = Math.min(2, Math.max(1, node.attrs?.level || 1));
        const Heading = level === 1 ? "h1" : "h2";
        const headingText = getNodeText(node).trim().toLowerCase();
        const id = sectionIds[headingText] || headingText.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return <Heading key={key} id={level === 2 ? id : undefined}>{inline()}</Heading>;
      case "bulletList":
        return <ul key={key}>{node.content?.map((n: any, i: number) => renderNode(n, i))}</ul>;
      case "orderedList":
        return <ol key={key}>{node.content?.map((n: any, i: number) => renderNode(n, i))}</ol>;
      case "listItem":
        return <li key={key}>{node.content?.map((n: any, i: number) => renderNode(n, i))}</li>;
      case "table":
        return <table key={key}><tbody>{node.content?.map((n: any, i: number) => renderNode(n, i))}</tbody></table>;
      case "tableRow":
        return <tr key={key}>{node.content?.map((n: any, i: number) => renderNode(n, i))}</tr>;
      case "tableHeader":
        return <th key={key}>{node.content?.map((n: any, i: number) => renderNode(n, i))}</th>;
      case "tableCell":
        return <td key={key}>{node.content?.map((n: any, i: number) => renderNode(n, i))}</td>;
      case "architectureDiagram":
        return <ArchitectureDiagram key={key} diagram={{
          nodes: node.attrs?.nodes || [],
          edges: node.attrs?.edges || []
        } as ArchitectureDiagramData} />;
      default:
        return <div key={key}>{node.content?.map((n: any, i: number) => renderNode(n, i))}</div>;
    }
  };
  return doc.content?.map((node: any, i: number) => renderNode(node, i));
}

export function documentToPlainText(doc: any): string {
  const renderNode = (node: any): string => {
    if (node?.type === "text") return node.text || "";
    if (node?.type === "hardBreak") return "\n";
    if (node?.type === "architectureDiagram") {
      return `System architecture: ${(node.attrs?.nodes || []).map((item: any) => item.data?.title).join(", ")}`;
    }
    if (!Array.isArray(node?.content)) return "";

    const children = node.content.map(renderNode);
    switch (node.type) {
      case "doc":
        return children.join("\n\n");
      case "paragraph":
      case "heading":
        return children.join("");
      case "table":
        return children.join("\n");
      case "tableRow":
        return children.join(" | ");
      case "tableCell":
      case "tableHeader":
        return children.join("");
      case "bulletList":
      case "orderedList":
        return children.join("\n");
      case "listItem":
        return `• ${children.join("")}`;
      default:
        return children.join("");
    }
  };
  return renderNode(doc).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
