import { useState } from "react";
import type { Revision } from "../types/article";
import { api } from "../services/api";
import Modal from "./Modal";
import { renderDocument } from "../utils/documentRenderer";
import styles from "../styles/admin.module.css";
import { normalizeDiagramDocument } from "../utils/diagramModel";

export default function AdminPanel({ revisions, current, onRestored, onLogout, onArticle }: {
  revisions: Revision[]; current: Revision; onRestored: () => Promise<void>; onLogout: () => Promise<void>; onArticle: () => void;
}) {
  const [confirm, setConfirm] = useState<{ kind: "revision" | "default"; revision?: Revision } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const restore = async () => {
    if (!confirm) return;
    setBusy(true);
    setMessage("");
    try {
      if (confirm.kind === "default") await api.restoreDefault();
      else if (confirm.revision) await api.restoreRevision(confirm.revision.id);
      setConfirm(null);
      await onRestored();
      setMessage("Restoration saved as a new revision.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Restoration failed");
    } finally { setBusy(false); }
  };

  return (
    <main className={styles.admin}>
      <header className={styles.header}>
        <div><span>Cloud &amp; PaaS Reflection</span><h1>Admin Panel</h1></div>
        <div>
          <button type="button" onClick={onArticle}>View Article</button>
          <button type="button" onClick={() => void onLogout()}>Logout</button>
        </div>
      </header>
      <section className={styles.section}>
        <div className={styles.sectionTitle}><div><h2>Article Management</h2><p>Current article and preserved revision history</p></div>
          <button type="button" className={styles.restoreDefault} onClick={() => setConfirm({ kind: "default" })}>Restore Default Article</button>
        </div>
        {message && <p className={styles.success}>{message}</p>}
        <div className={styles.currentCard}>
          <div><b>Current revision</b><strong>Version {current.version} — {current.editorName}</strong><small>{new Date(current.createdAt).toLocaleString()}</small></div>
          <div className={styles.preview}>{renderDocument(normalizeDiagramDocument(current.content))}</div>
        </div>
      </section>
      <section className={styles.section}>
        <h2>Revision History</h2>
        <div className={styles.table}>
          {revisions.map((revision) => (
            <div className={styles.row} key={revision.id}>
              <div><b>Version {revision.version}</b>{revision.isOriginal && <em>Original</em>}</div>
              <div><span>{revision.editorName}</span><small>{new Date(revision.createdAt).toLocaleString()}</small></div>
              {revision.id === current.id ? <strong className={styles.latest}>Latest</strong> : <button type="button" onClick={() => setConfirm({ kind: "revision", revision })}>Restore This Version</button>}
            </div>
          ))}
        </div>
      </section>
      {confirm && (
        <Modal title="Confirm Restoration" onClose={busy ? undefined : () => setConfirm(null)} closeDisabled={busy}>
          <div className={styles.confirm}>
            {confirm.kind === "default" ? (
              <p>Restore the original default article as a new revision? All existing revisions will remain preserved.</p>
            ) : (
              <>
                <p>Restore <strong>Version {confirm.revision?.version}</strong> by <strong>{confirm.revision?.editorName}</strong>?</p>
                <small>{confirm.revision && new Date(confirm.revision.createdAt).toLocaleString()}</small>
              </>
            )}
            <div><button type="button" onClick={() => setConfirm(null)} disabled={busy}>Cancel</button><button type="button" className={styles.confirmRestore} onClick={restore} disabled={busy}>{busy ? "Restoring..." : "Confirm Restore"}</button></div>
          </div>
        </Modal>
      )}
    </main>
  );
}
