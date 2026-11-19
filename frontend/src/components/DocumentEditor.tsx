import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, List, ListOrdered, Plus, Redo2, Save, Table2, Trash2, Underline as UnderlineIcon, Undo2, X } from "lucide-react";
import type { TipTapDocument } from "../types/article";
import { ArchitectureDiagramExtension } from "./ArchitectureDiagramNode";
import { defaultDiagram } from "../utils/diagramModel";
import styles from "../styles/editor.module.css";

interface Props {
  content: TipTapDocument;
  editorName: string;
  onCancel: () => void;
  onSave: (content: TipTapDocument) => Promise<void>;
  saving: boolean;
}

export default function DocumentEditor({ content, editorName, onCancel, onSave, saving }: Props) {
  const [tableActive, setTableActive] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true, allowTableNodeSelection: true }),
      TableRow,
      TableHeader,
      TableCell,
      ArchitectureDiagramExtension
    ],
    content: content as unknown as JSONContent
  });

  useEffect(() => {
    if (!editor) return;
    const updateTableState = () => setTableActive(editor.isActive("table"));
    editor.on("selectionUpdate", updateTableState);
    editor.on("transaction", updateTableState);
    updateTableState();
    return () => {
      editor.off("selectionUpdate", updateTableState);
      editor.off("transaction", updateTableState);
    };
  }, [editor]);

  if (!editor) return null;

  const save = async () => {
    await onSave(editor.getJSON() as TipTapDocument);
  };
  const positionOutsideTable = () => {
    const selection = editor.state.selection.$from;
    for (let depth = selection.depth; depth > 0; depth--) {
      if (selection.node(depth).type.name === "table") return selection.after(depth);
    }
    return null;
  };
  const insertTable = () => {
    const position = positionOutsideTable();
    const chain = editor.chain().focus();
    if (position !== null) chain.setTextSelection(position);
    chain.insertTable({ rows, cols: columns, withHeaderRow: true }).run();
    setShowTablePicker(false);
  };
  const insertDiagram = () => {
    const prefix = `diagram-${crypto.randomUUID()}`;
    const ids = new Map(defaultDiagram.nodes.map(node => [node.id, `${prefix}-${node.id}`]));
    const position = positionOutsideTable();
    const chain = editor.chain().focus();
    if (position !== null) chain.setTextSelection(position);
    chain.insertContent({
      type: "architectureDiagram",
      attrs: {
        nodes: defaultDiagram.nodes.map(node => ({ ...structuredClone(node), id: ids.get(node.id)! })),
        edges: defaultDiagram.edges.map(edge => ({
          ...structuredClone(edge),
          id: `${prefix}-${edge.id}`,
          source: ids.get(edge.source)!,
          target: ids.get(edge.target)!
        }))
      }
    }).run();
  };
  const tableCommand = (command: () => boolean) => {
    if (tableActive) command();
    editor.commands.focus();
  };

  return (
    <div className={styles.editor}>
      <div className={styles.editorHeader}>
        <div><span className={styles.editingLabel}>Editing as</span><strong>{editorName}</strong></div>
        <div className={styles.editorActions}>
          <button type="button" className={styles.cancel} onClick={onCancel} disabled={saving}><X size={16} />Cancel</button>
          <button type="button" className={styles.save} onClick={save} disabled={saving}><Save size={16} />{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </div>
      <div className={styles.toolbar} role="toolbar" aria-label="Formatting tools">
        <button type="button" aria-label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? styles.active : ""}><Bold size={16} /></button>
        <button type="button" aria-label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? styles.active : ""}><Italic size={16} /></button>
        <button type="button" aria-label="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive("underline") ? styles.active : ""}><UnderlineIcon size={16} /></button>
        <span className={styles.separator} />
        <button type="button" onClick={() => editor.chain().focus().setParagraph().run()}>P</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <span className={styles.separator} />
        <button type="button" aria-label="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></button>
        <button type="button" aria-label="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></button>
        <span className={styles.separator} />
        <button type="button" aria-label="Align left" onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft size={16} /></button>
        <button type="button" aria-label="Align center" onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter size={16} /></button>
        <button type="button" aria-label="Align right" onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight size={16} /></button>
        <span className={styles.separator} />
        <button type="button" onClick={() => setShowTablePicker(value => !value)}><Table2 size={16} />Table</button>
        <button type="button" onClick={insertDiagram}><Plus size={16} />Diagram</button>
        <span className={styles.separator} />
        <button type="button" aria-label="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo2 size={16} /></button>
        <button type="button" aria-label="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo2 size={16} /></button>
      </div>
      {showTablePicker && (
        <div className={styles.tablePicker}>
          <label>Rows <input type="number" min={1} max={20} value={rows} onChange={event => setRows(Math.min(20, Math.max(1, Number(event.target.value) || 1)))} /></label>
          <label>Columns <input type="number" min={1} max={12} value={columns} onChange={event => setColumns(Math.min(12, Math.max(1, Number(event.target.value) || 1)))} /></label>
          <button type="button" onClick={insertTable}>Insert Table</button>
        </div>
      )}
      {tableActive && (
        <div className={styles.tableToolbar} role="toolbar" aria-label="Table editing tools">
          <span>Table</span>
          <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => tableCommand(() => editor.chain().focus().addRowBefore().run())}>Row Above</button>
          <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => tableCommand(() => editor.chain().focus().addRowAfter().run())}>Row Below</button>
          <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => tableCommand(() => editor.chain().focus().deleteRow().run())}>Delete Row</button>
          <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => tableCommand(() => editor.chain().focus().addColumnBefore().run())}>Column Before</button>
          <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => tableCommand(() => editor.chain().focus().addColumnAfter().run())}>Column After</button>
          <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => tableCommand(() => editor.chain().focus().deleteColumn().run())}>Delete Column</button>
          <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => tableCommand(() => editor.chain().focus().toggleHeaderRow().run())}>Toggle Header Row</button>
          <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => tableCommand(() => editor.chain().focus().deleteTable().run())}><Trash2 size={14} />Delete Table</button>
        </div>
      )}
      <EditorContent editor={editor} className={styles.canvas} />
    </div>
  );
}
