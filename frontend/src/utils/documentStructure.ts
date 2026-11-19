import type { ArchitectureDiagramData } from "../types/diagram";

export interface TableSnapshot {
  rows: string[][];
  columns: number;
}

export interface TableChange {
  index: number;
  added?: boolean;
  removed?: boolean;
  addedRows: number[];
  removedRows: number[];
  addedColumns: number;
  removedColumns: number;
  changedCells: Array<{ row: number; column: number; before: string; after: string }>;
}

export interface DiagramChanges {
  addedNodes: ArchitectureDiagramData["nodes"];
  removedNodes: ArchitectureDiagramData["nodes"];
  modifiedNodes: Array<{ before: ArchitectureDiagramData["nodes"][number]; after: ArchitectureDiagramData["nodes"][number] }>;
  addedEdges: ArchitectureDiagramData["edges"];
  removedEdges: ArchitectureDiagramData["edges"];
}

function textContent(node: any): string {
  if (typeof node?.text === "string") return node.text;
  return Array.isArray(node?.content) ? node.content.map(textContent).join("") : "";
}

function walk(node: any, visit: (node: any) => void) {
  if (!node || typeof node !== "object") return;
  visit(node);
  if (Array.isArray(node.content)) node.content.forEach((child: any) => walk(child, visit));
}

export function collectTables(document: any): TableSnapshot[] {
  const tables: TableSnapshot[] = [];
  walk(document, node => {
    if (node.type !== "table") return;
    const rows: string[][] = (node.content || []).filter((row: any) => row.type === "tableRow").map((row: any) =>
      (row.content || []).map((cell: any) => textContent(cell).trim()) as string[]
    );
    tables.push({ rows, columns: rows.reduce((max, row) => Math.max(max, row.length), 0) });
  });
  return tables;
}

function rowDifference(before: string[][], after: string[][]) {
  const unmatchedAfter = new Set(after.map((_, index) => index));
  const unmatchedBefore = new Set(before.map((_, index) => index));
  for (let beforeIndex = 0; beforeIndex < before.length; beforeIndex++) {
    const signature = JSON.stringify(before[beforeIndex]);
    const afterIndex = after.findIndex((row, index) => unmatchedAfter.has(index) && JSON.stringify(row) === signature);
    if (afterIndex >= 0) {
      unmatchedBefore.delete(beforeIndex);
      unmatchedAfter.delete(afterIndex);
    }
    const changedRows = Math.min(unmatchedBefore.size, unmatchedAfter.size);
    for (let index = 0; index < changedRows; index++) {
      unmatchedBefore.delete([...unmatchedBefore][0]);
      unmatchedAfter.delete([...unmatchedAfter][0]);
    }
  }
  return {
    removedRows: [...unmatchedBefore].map(index => index + 1),
    addedRows: [...unmatchedAfter].map(index => index + 1)
  };
}

export function compareTables(beforeDoc: any, afterDoc: any): TableChange[] {
  const before = collectTables(beforeDoc);
  const after = collectTables(afterDoc);
  const changes: TableChange[] = [];
  for (let index = 0; index < Math.max(before.length, after.length); index++) {
    const oldTable = before[index];
    const newTable = after[index];
    if (!oldTable || !newTable) {
      changes.push({
        index: index + 1,
        added: !oldTable,
        removed: !newTable,
        addedRows: newTable ? newTable.rows.map((_, row) => row + 1) : [],
        removedRows: oldTable ? oldTable.rows.map((_, row) => row + 1) : [],
        addedColumns: newTable?.columns || 0,
        removedColumns: oldTable?.columns || 0,
        changedCells: []
      });
      continue;
    }
    const { addedRows, removedRows } = rowDifference(oldTable.rows, newTable.rows);
    const addedColumns = Math.max(0, newTable.columns - oldTable.columns);
    const removedColumns = Math.max(0, oldTable.columns - newTable.columns);
    const changedCells: TableChange["changedCells"] = [];
    for (let row = 0; row < Math.min(oldTable.rows.length, newTable.rows.length); row++) {
      for (let column = 0; column < Math.min(oldTable.rows[row].length, newTable.rows[row].length); column++) {
        const oldValue = oldTable.rows[row][column];
        const newValue = newTable.rows[row][column];
        if (oldValue !== newValue) changedCells.push({ row: row + 1, column: column + 1, before: oldValue, after: newValue });
      }
    }
    if (addedRows.length || removedRows.length || addedColumns || removedColumns || changedCells.length) {
      changes.push({ index: index + 1, addedRows, removedRows, addedColumns, removedColumns, changedCells });
    }
  }
  return changes;
}

export function getDiagram(document: any): ArchitectureDiagramData {
  const diagram: ArchitectureDiagramData = { nodes: [], edges: [] };
  let diagramIndex = 0;
  walk(document, node => {
    if (node.type !== "architectureDiagram") return;
    const offsetY = diagramIndex * 620;
    const nodes = node.attrs?.nodes || [];
    diagram.nodes.push(...nodes.map((item: ArchitectureDiagramData["nodes"][number]) => ({
      ...item,
      position: { ...item.position, y: item.position.y + offsetY }
    })));
    diagram.edges.push(...(node.attrs?.edges || []));
    diagramIndex++;
  });
  return diagram;
}

export function compareDiagrams(beforeDoc: any, afterDoc: any): DiagramChanges {
  const before = getDiagram(beforeDoc);
  const after = getDiagram(afterDoc);
  const oldNodes = new Map(before.nodes.map(node => [node.id, node]));
  const newNodes = new Map(after.nodes.map(node => [node.id, node]));
  const addedNodes = after.nodes.filter(node => !oldNodes.has(node.id));
  const removedNodes = before.nodes.filter(node => !newNodes.has(node.id));
  const modifiedNodes = after.nodes.flatMap(node => {
    const oldNode = oldNodes.get(node.id);
    if (!oldNode) return [];
    const changed = oldNode.data.title !== node.data.title ||
      oldNode.data.description !== node.data.description ||
      oldNode.position.x !== node.position.x || oldNode.position.y !== node.position.y;
    return changed ? [{ before: oldNode, after: node }] : [];
  });
  const edgeKey = (edge: ArchitectureDiagramData["edges"][number]) => `${edge.source}->${edge.target}`;
  const oldEdges = new Map(before.edges.map(edge => [edgeKey(edge), edge]));
  const newEdges = new Map(after.edges.map(edge => [edgeKey(edge), edge]));
  return {
    addedNodes,
    removedNodes,
    modifiedNodes,
    addedEdges: after.edges.filter(edge => !oldEdges.has(edgeKey(edge))),
    removedEdges: before.edges.filter(edge => !newEdges.has(edgeKey(edge)))
  };
}
