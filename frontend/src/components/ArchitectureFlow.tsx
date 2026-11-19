import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addEdge,
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  useEdgesState,
  useNodesState
} from "@xyflow/react";
import type { ArchitectureDiagramData, ArchitectureNodeData } from "../types/diagram";
import styles from "../styles/diagram.module.css";

function ArchitectureNodeView({ data, selected }: NodeProps<Node<ArchitectureNodeData>>) {
  return (
    <div className={`${styles.node} ${selected ? styles.selectedNode : ""}`}>
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} id="left-target" />
      <strong>{data.title}</strong>
      {data.description && <small>{data.description}</small>}
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="right-source" />
    </div>
  );
}

const nodeTypes = { architecture: ArchitectureNodeView };

interface Props {
  diagram: ArchitectureDiagramData;
  editable?: boolean;
  onChange?: (diagram: ArchitectureDiagramData) => void;
  onSelection?: (nodeIds: string[], edgeIds: string[]) => void;
  connectMode?: boolean;
  onConnectModeFinish?: () => void;
  onReady?: (fitView: () => void) => void;
  highlightedNodeIds?: string[];
  modifiedNodeIds?: string[];
  removedNodeIds?: string[];
  highlightedEdgeKeys?: string[];
  removedEdgeKeys?: string[];
}

export default function ArchitectureFlow({
  diagram,
  editable = false,
  onChange,
  onSelection,
  connectMode = false,
  onConnectModeFinish,
  onReady,
  highlightedNodeIds = [],
  modifiedNodeIds = [],
  removedNodeIds = [],
  highlightedEdgeKeys = [],
  removedEdgeKeys = []
}: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ArchitectureNodeData>>(diagram.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(diagram.edges);
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const [fitDiagram, setFitDiagram] = useState<(() => void) | null>(null);

  useEffect(() => {
    setNodes(diagram.nodes);
    setEdges(diagram.edges);
  }, [diagram]);

  const commit = useCallback((nextNodes: Node<ArchitectureNodeData>[], nextEdges: Edge[]) => {
    onChange?.({
      nodes: nextNodes.map(node => ({
        id: node.id,
        type: "architecture",
        position: node.position,
        data: node.data,
        ...(node.style ? { style: node.style } : {})
      })),
      edges: nextEdges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        ...(edge.sourceHandle ? { sourceHandle: edge.sourceHandle } : {}),
        ...(edge.targetHandle ? { targetHandle: edge.targetHandle } : {}),
        ...(edge.type ? { type: edge.type } : {}),
        ...(edge.markerEnd ? { markerEnd: edge.markerEnd } : {}),
        ...(edge.style ? { style: edge.style } : {})
      }))
    });
  }, [onChange]);

  const connect = useCallback((connection: Connection) => {
    const next = addEdge({ ...connection, type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } }, edges);
    setEdges(next);
    commit(nodes, next);
  }, [commit, edges, nodes]);

  const selectNode = (node: Node) => {
    if (!editable || !connectMode) return;
    if (!connectSource) {
      setConnectSource(node.id);
      return;
    }
    if (connectSource !== node.id && !edges.some(edge => edge.source === connectSource && edge.target === node.id)) {
      connect({ source: connectSource, target: node.id, sourceHandle: null, targetHandle: null });
    }
    setConnectSource(null);
    onConnectModeFinish?.();
  };

  const dragStop = (changed: Node) => {
    const next = nodes.map(node => node.id === changed.id ? { ...node, position: changed.position } : node);
    setNodes(next);
    commit(next, edges);
  };

  const flowNodes = useMemo(() => nodes.map(node => ({
    ...node,
    className: [
      node.className || "",
      highlightedNodeIds.includes(node.id) ? styles.addedNode : "",
      modifiedNodeIds.includes(node.id) ? styles.modifiedNode : "",
      removedNodeIds.includes(node.id) ? styles.removedNode : ""
    ].filter(Boolean).join(" ")
  })), [nodes, highlightedNodeIds, modifiedNodeIds, removedNodeIds]);
  const flowEdges = useMemo(() => edges.map(edge => {
    const key = `${edge.source}->${edge.target}`;
    const added = highlightedEdgeKeys.includes(key);
    const removed = removedEdgeKeys.includes(key);
    return { ...edge, className: added ? styles.addedEdge : removed ? styles.removedEdge : edge.className };
  }), [edges, highlightedEdgeKeys, removedEdgeKeys]);

  return (
    <div className={`${styles.flow} ${editable ? styles.editableFlow : ""}`}>
      {editable && <div className={styles.modeHint}>{connectMode ? (connectSource ? "Select the destination box." : "Select the source box.") : "Drag boxes to rearrange. Use handles or Connect Boxes to add arrows."}</div>}
      <ReactFlow
        style={{ background: "#f8fafc" }}
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodesChange={editable ? onNodesChange : undefined}
        onEdgesChange={editable ? onEdgesChange : undefined}
        onConnect={editable ? connect : undefined}
        onNodeClick={editable ? (_event, node) => selectNode(node) : undefined}
        onNodeDragStop={editable ? (_event, node) => dragStop(node) : undefined}
        onSelectionChange={editable ? ({ nodes: selectedNodes, edges: selectedEdges }) =>
          onSelection?.(selectedNodes.map(node => node.id), selectedEdges.map(edge => edge.id)) : undefined}
        onInit={instance => {
          const fit = () => { void instance.fitView({ padding: 0.18, duration: 200 }); };
          setFitDiagram(() => fit);
          onReady?.(fit);
        }}
        nodesDraggable={editable}
        nodesConnectable={editable}
        elementsSelectable={editable}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.25}
        maxZoom={1.5}
        deleteKeyCode={null}
      >
        <Background color="#cbd5e1" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
      {!editable && !diagram.nodes.length && <span className={styles.empty}>No diagram nodes</span>}
    </div>
  );
}
