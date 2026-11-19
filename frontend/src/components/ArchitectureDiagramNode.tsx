import { useMemo, useRef, useState } from "react";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Node } from "@tiptap/core";
import { Plus, Pencil, Link2, Trash2, Undo2 } from "lucide-react";
import ArchitectureFlow from "./ArchitectureFlow";
import type { ArchitectureDiagramData } from "../types/diagram";
import { defaultDiagram } from "../utils/diagramModel";
import Modal from "./Modal";
import styles from "../styles/diagram.module.css";

function DiagramNodeView({ node, updateAttributes, editor }: any) {
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);
  const [connectMode, setConnectMode] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [flowFit, setFlow] = useState<(() => void) | null>(null);
  const pendingSelection = useRef<string | null>(null);
  const diagram = useMemo<ArchitectureDiagramData>(() => ({
    nodes: Array.isArray(node.attrs.nodes) ? node.attrs.nodes : defaultDiagram.nodes,
    edges: Array.isArray(node.attrs.edges) ? node.attrs.edges : defaultDiagram.edges
  }), [node.attrs.edges, node.attrs.nodes]);

  const updateDiagram = (next: ArchitectureDiagramData) => updateAttributes({ nodes: next.nodes, edges: next.edges });
  const addBox = () => {
    const newId = `box-${crypto.randomUUID()}`;
    pendingSelection.current = newId;
    setSelectedNodeIds([newId]);
    updateDiagram({
      nodes: [...diagram.nodes, {
        id: newId,
        type: "architecture",
        position: { x: 800 + (diagram.nodes.length % 2) * 220, y: 40 + Math.floor(diagram.nodes.length / 2) * 140 },
        data: { title: "New component", description: "" }
      }],
      edges: diagram.edges
    });
    setSelectedEdgeIds([]);
    window.setTimeout(() => {
      flowFit?.();
      pendingSelection.current = null;
    }, 100);
  };
  const deleteSelectedBoxes = () => {
    const removeIds = new Set(selectedNodeIds);
    updateDiagram({
      nodes: diagram.nodes.filter(item => !removeIds.has(item.id)),
      edges: diagram.edges.filter(item => !removeIds.has(item.source) && !removeIds.has(item.target))
    });
    setSelectedNodeIds([]);
  };
  const deleteSelectedConnections = () => {
    updateDiagram({ ...diagram, edges: diagram.edges.filter(item => !selectedEdgeIds.includes(item.id)) });
    setSelectedEdgeIds([]);
  };
  const editSelected = () => {
    const selected = diagram.nodes.find(item => item.id === selectedNodeIds[0]);
    if (!selected) return;
    setEditingNodeId(selected.id);
    setTitle(selected.data.title || "");
    setDescription(selected.data.description || "");
  };
  const saveNodeDetails = () => {
    updateDiagram({
      ...diagram,
      nodes: diagram.nodes.map(item => item.id === editingNodeId
        ? { ...item, data: { ...item.data, title: title.trim() || "Untitled box", description: description.trim() } }
        : item)
    });
    setEditingNodeId(null);
  };

  return (
    <NodeViewWrapper className={styles.diagramNodeView} contentEditable={false}>
      <div className={styles.diagramEditorHeader}>
        <strong>System Architecture Diagram</strong>
        <span>Editable diagram</span>
      </div>
      <div className={styles.diagramToolbar}>
        <button type="button" onClick={addBox}><Plus size={14} />Add Box</button>
        <button type="button" onClick={editSelected} disabled={!selectedNodeIds.length}><Pencil size={14} />Edit Selected Box</button>
        <button type="button" className={connectMode ? styles.activeControl : ""} onClick={() => { setConnectMode(value => !value); setSelectedNodeIds([]); }}><Link2 size={14} />{connectMode ? "Cancel Connect" : "Connect Boxes"}</button>
        <button type="button" onClick={deleteSelectedBoxes} disabled={!selectedNodeIds.length}><Trash2 size={14} />Delete Selected Box</button>
        <button type="button" onClick={deleteSelectedConnections} disabled={!selectedEdgeIds.length}><Trash2 size={14} />Delete Connection</button>
        <button type="button" onClick={() => flowFit?.()}>Fit Diagram</button>
        <button type="button" onClick={() => editor.chain().focus().undo().run()}><Undo2 size={14} />Undo</button>
      </div>
      <ArchitectureFlow
        diagram={diagram}
        editable={editor.isEditable}
        connectMode={connectMode}
        onConnectModeFinish={() => setConnectMode(false)}
        onChange={updateDiagram}
        onSelection={(nodeIds, edgeIds) => {
          if (!nodeIds.length && pendingSelection.current) return;
          setSelectedNodeIds(nodeIds);
          setSelectedEdgeIds(edgeIds);
        }}
        onReady={fit => setFlow(() => fit)}
      />
      {editingNodeId && (
        <Modal title="Edit diagram box" onClose={() => setEditingNodeId(null)}>
          <div className={styles.editForm}>
            <label htmlFor="diagram-box-title">Title</label>
            <input id="diagram-box-title" value={title} maxLength={200} onChange={event => setTitle(event.target.value)} />
            <label htmlFor="diagram-box-description">Description (optional)</label>
            <textarea id="diagram-box-description" value={description} maxLength={500} onChange={event => setDescription(event.target.value)} rows={3} />
            <button type="button" onClick={saveNodeDetails}>Save Box</button>
          </div>
        </Modal>
      )}
    </NodeViewWrapper>
  );
}

export const ArchitectureDiagramExtension = Node.create({
  name: "architectureDiagram",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      nodes: { default: defaultDiagram.nodes },
      edges: { default: defaultDiagram.edges }
    };
  },

  parseHTML() {
    return [{
      tag: 'div[data-type="architecture-diagram"]',
      getAttrs: element => {
        const elementNode = element as HTMLElement;
        try {
          return {
            nodes: JSON.parse(elementNode.dataset.nodes || "[]"),
            edges: JSON.parse(elementNode.dataset.edges || "[]")
          };
        } catch {
          return false;
        }
      }
    }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", {
      ...HTMLAttributes,
      "data-type": "architecture-diagram",
      "data-nodes": JSON.stringify(HTMLAttributes.nodes),
      "data-edges": JSON.stringify(HTMLAttributes.edges)
    }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DiagramNodeView, { as: "div", className: styles.diagramNodeViewContainer });
  }
});
