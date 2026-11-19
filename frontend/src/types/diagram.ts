import type { Edge, Node } from "@xyflow/react";

export interface ArchitectureNodeData extends Record<string, unknown> {
  title: string;
  description?: string;
}

export type ArchitectureNode = Node<ArchitectureNodeData, "architecture">;
export type ArchitectureEdge = Edge;

export interface ArchitectureDiagramData {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}
