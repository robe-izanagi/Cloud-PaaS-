import { diffWordsWithSpace } from "diff";
import type { Revision } from "../types/article";
import { documentToPlainText } from "../utils/documentRenderer";
import ArchitectureFlow from "./ArchitectureFlow";
import { normalizeDiagramDocument } from "../utils/diagramModel";
import { compareDiagrams, compareTables, getDiagram } from "../utils/documentStructure";
import styles from "../styles/history.module.css";

export default function VersionComparison({ selected, current, onBack }: { selected: Revision; current: Revision; onBack: () => void }) {
  const historicalDocument = normalizeDiagramDocument(selected.content);
  const currentDocument = normalizeDiagramDocument(current.content);
  const parts = diffWordsWithSpace(
    documentToPlainText(historicalDocument),
    documentToPlainText(currentDocument)
  );
  const tableChanges = compareTables(historicalDocument, currentDocument);
  const diagramChanges = compareDiagrams(historicalDocument, currentDocument);
  const historicalDiagram = getDiagram(historicalDocument);
  const currentDiagram = getDiagram(currentDocument);
  const removedIds = diagramChanges.removedNodes.map(node => node.id);
  const diagramPreview = {
    nodes: [...currentDiagram.nodes, ...diagramChanges.removedNodes],
    edges: [...currentDiagram.edges, ...diagramChanges.removedEdges]
  };
  const hasDiagramChanges = diagramChanges.addedNodes.length > 0 ||
    diagramChanges.removedNodes.length > 0 ||
    diagramChanges.modifiedNodes.length > 0 ||
    diagramChanges.addedEdges.length > 0 ||
    diagramChanges.removedEdges.length > 0;
  const hasTableChanges = tableChanges.length > 0;

  return (
    <main className={styles.comparison}>
      <button type="button" className={styles.back} onClick={onBack}>← Back to Version History</button>
      <div className={styles.comparisonHeader}>
        <div><span>Historical</span><strong>Version {selected.version} — {selected.editorName}</strong><small>{new Date(selected.createdAt).toLocaleString()}</small></div>
        <div><span>Current</span><strong>Version {current.version} — {current.editorName}</strong></div>
      </div>
      <div className={styles.legend}><span><i className={styles.removedBox} />Removed</span><span><i className={styles.addedBox} />Added</span></div>
      <div className={styles.diffText}>
        {parts.map((part, index) => (
          <span key={index} className={part.added ? styles.added : part.removed ? styles.removed : ""}>
            {part.value}
          </span>
        ))}
      </div>
      <section className={styles.structuredChanges}>
        <h2>Table changes</h2>
        {!hasTableChanges ? <p>No table structure or cell changes.</p> : tableChanges.map(change => (
          <div className={styles.structureCard} key={`table-${change.index}`}>
            <strong>Table {change.index}{change.added ? " added" : change.removed ? " removed" : ""}</strong>
            {change.addedRows.length > 0 && <p className={styles.addedSummary}>Added row{change.addedRows.length > 1 ? "s" : ""}: {change.addedRows.join(", ")}</p>}
            {change.removedRows.length > 0 && <p className={styles.removedSummary}>Removed row{change.removedRows.length > 1 ? "s" : ""}: {change.removedRows.join(", ")}</p>}
            {change.addedColumns > 0 && <p className={styles.addedSummary}>Added {change.addedColumns} column{change.addedColumns > 1 ? "s" : ""}.</p>}
            {change.removedColumns > 0 && <p className={styles.removedSummary}>Removed {change.removedColumns} column{change.removedColumns > 1 ? "s" : ""}.</p>}
            {change.changedCells.map(cell => (
              <p className={styles.cellChange} key={`${cell.row}-${cell.column}`}>
                Cell R{cell.row} C{cell.column}: <del>{cell.before || "(empty)"}</del> <span>→</span> <ins>{cell.after || "(empty)"}</ins>
              </p>
            ))}
          </div>
        ))}
      </section>
      <section className={styles.structuredChanges}>
        <h2>Diagram changes</h2>
        {!hasDiagramChanges ? <p>No architecture diagram changes.</p> : (
          <>
            <div className={styles.diagramChangeList}>
              {diagramChanges.addedNodes.map(node => <p className={styles.addedSummary} key={`added-${node.id}`}>Added box: <strong>{node.data.title}</strong></p>)}
              {diagramChanges.removedNodes.map(node => <p className={styles.removedSummary} key={`removed-${node.id}`}>Removed box: <strong>{node.data.title}</strong></p>)}
              {diagramChanges.modifiedNodes.map(({ before, after }) => (
                <p className={styles.modifiedSummary} key={`modified-${after.id}`}>
                  Modified box: <strong>{before.data.title}</strong> → <strong>{after.data.title}</strong>
                  {before.data.description !== after.data.description && <> (description changed)</>}
                  {(before.position.x !== after.position.x || before.position.y !== after.position.y) && <> (position changed)</>}
                </p>
              ))}
              {diagramChanges.addedEdges.map(edge => <p className={styles.addedSummary} key={`edge-added-${edge.id}`}>Added connection: <strong>{currentDiagram.nodes.find(node => node.id === edge.source)?.data.title || edge.source} → {currentDiagram.nodes.find(node => node.id === edge.target)?.data.title || edge.target}</strong></p>)}
              {diagramChanges.removedEdges.map(edge => <p className={styles.removedSummary} key={`edge-removed-${edge.id}`}>Removed connection: <strong>{historicalDiagram.nodes.find(node => node.id === edge.source)?.data.title || edge.source} → {historicalDiagram.nodes.find(node => node.id === edge.target)?.data.title || edge.target}</strong></p>)}
            </div>
            <div className={styles.diagramDiffPreview}>
              <ArchitectureFlow
                diagram={diagramPreview}
                highlightedNodeIds={diagramChanges.addedNodes.map(node => node.id)}
                modifiedNodeIds={diagramChanges.modifiedNodes.map(change => change.after.id)}
                removedNodeIds={removedIds}
                highlightedEdgeKeys={diagramChanges.addedEdges.map(edge => `${edge.source}->${edge.target}`)}
                removedEdgeKeys={diagramChanges.removedEdges.map(edge => `${edge.source}->${edge.target}`)}
              />
              <div className={styles.diagramLegend}><span className={styles.legendAdded}>Added</span><span className={styles.legendModified}>Modified</span><span className={styles.legendRemoved}>Removed</span></div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
