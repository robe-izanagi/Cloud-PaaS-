import type { Revision } from "../types/article";
import styles from "../styles/history.module.css";

export default function History({ revisions, current, onCompare, onArticle }: {
  revisions: Revision[]; current: Revision; onCompare: (revision: Revision) => void; onArticle: () => void;
}) {
  return (
    <main className={styles.history}>
      <button type="button" className={styles.back} onClick={onArticle}>← Back to Article</button>
      <h1>Version History</h1>
      <p className={styles.subtitle}>Every saved revision is preserved and remains available for comparison.</p>
      <div className={styles.timeline}>
        {revisions.map((revision) => (
          <button type="button" key={revision.id} className={styles.revision} onClick={() => onCompare(revision)}>
            <div className={styles.revisionIcon}>{revision.version}</div>
            <div className={styles.revisionInfo}>
              <strong>Version {revision.version} <span>— {revision.editorName}</span>{revision.isOriginal && <em>Original</em>}</strong>
              <small>{new Date(revision.createdAt).toLocaleString()}</small>
            </div>
            {revision.id === current.id && <b className={styles.current}>CURRENT</b>}
            <span className={styles.compare}>Compare →</span>
          </button>
        ))}
      </div>
    </main>
  );
}
