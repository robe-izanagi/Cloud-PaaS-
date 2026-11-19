import { useEffect, useState } from "react";
import { History as HistoryIcon, Edit3, ShieldCheck, Cloud } from "lucide-react";
import { api } from "./services/api";
import type { Revision, TipTapDocument } from "./types/article";
import { renderDocument } from "./utils/documentRenderer";
import DocumentEditor from "./components/DocumentEditor";
import NameModal from "./components/NameModal";
import History from "./components/History";
import VersionComparison from "./components/VersionComparison";
import AdminChallenge from "./components/AdminChallenge";
import AdminPanel from "./components/AdminPanel";
import styles from "./styles/article.module.css";
import { normalizeDiagramDocument } from "./utils/diagramModel";

type View = "article" | "history" | "comparison" | "admin";

export default function App() {
  const [current, setCurrent] = useState<Revision | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [view, setView] = useState<View>("article");
  const [selected, setSelected] = useState<Revision | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [nameModal, setNameModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editorName, setEditorName] = useState("");
  const [saving, setSaving] = useState(false);
  const [adminChallenge, setAdminChallenge] = useState(false);
  const [admin, setAdmin] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const article = await api.getArticle();
      const history = await api.getRevisions();
      setCurrent(article.currentRevision);
      setRevisions(history.revisions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load article");
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!notice && !error) return;
    const timeout = window.setTimeout(() => {
      setNotice("");
      setError("");
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [notice, error]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (editing) { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [editing]);

  const save = async (content: TipTapDocument) => {
    if (!current) return;
    setSaving(true);
    setError("");
    try {
      const response = await api.saveRevision(editorName, content, current.version);
      setCurrent(response.revision);
      setEditing(false);
      setNotice("Changes saved successfully.");
      await load();
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 409) setError("This document has been updated by another user. Please reload the latest version before saving your changes.");
      else setError(err instanceof Error ? err.message : "Unable to save changes");
    } finally { setSaving(false); }
  };

  const openEditor = () => setNameModal(true);
  const continueEditing = (name: string) => { setEditorName(name); setNameModal(false); setEditing(true); };
  const cancelEditing = () => {
    if (window.confirm("Discard unsaved changes?")) setEditing(false);
  };
  const openComparison = (revision: Revision) => { setSelected(revision); setView("comparison"); };
  const adminAuthenticated = () => { setAdminChallenge(false); setAdmin(true); setView("admin"); };
  const logoutAdmin = async () => { await api.logoutAdmin(); setAdmin(false); setView("article"); };

  if (loading) return <div className={styles.pageStatus}>Loading article...</div>;
  if (error && !current) return <div className={styles.pageStatusError}><h1>Unable to load article</h1><p>{error}</p><button type="button" onClick={() => void load()}>Try Again</button></div>;
  if (!current) return null;
  const articleContent = normalizeDiagramDocument(current.content);

  if (view === "admin" && admin) {
    return <AdminPanel revisions={revisions} current={current} onRestored={load} onLogout={logoutAdmin} onArticle={() => setView("article")} />;
  }

  if (view === "history") {
    return <><Header onArticle={() => setView("article")} onHistory={() => setView("history")} onAdmin={() => setAdminChallenge(true)} /><History revisions={revisions} current={current} onCompare={openComparison} onArticle={() => setView("article")} />{adminChallenge && <AdminChallenge onClose={() => setAdminChallenge(false)} onAuthenticated={adminAuthenticated} />}</>;
  }
  if (view === "comparison" && selected) {
    return <><Header onArticle={() => setView("article")} onHistory={() => setView("history")} onAdmin={() => setAdminChallenge(true)} /><VersionComparison selected={selected} current={current} onBack={() => setView("history")} />{adminChallenge && <AdminChallenge onClose={() => setAdminChallenge(false)} onAuthenticated={adminAuthenticated} />}</>;
  }

  return (
    <div className={styles.app}>
      <Header onArticle={() => setView("article")} onHistory={() => setView("history")} onAdmin={() => setAdminChallenge(true)} />
      {(notice || error) && <div className={error ? styles.errorToast : styles.noticeToast} role={error ? "alert" : "status"} aria-live="polite">
        <span>{error || notice}</span>
        <button type="button" aria-label="Dismiss notification" onClick={() => { setNotice(""); setError(""); }}>×</button>
      </div>}
      {editing ? (
        <DocumentEditor content={articleContent} editorName={editorName} onCancel={cancelEditing} onSave={save} saving={saving} />
      ) : (
        <main className={styles.article}>
          <aside className={styles.toc}>
            <strong>On this page</strong>
            <a href="#introduction">Introduction</a>
            <a href="#models">IaaS and PaaS</a>
            <a href="#responsibility">Shared responsibility</a>
            <a href="#why-paas">Why PaaS</a>
            <a href="#architecture">System architecture</a>
            <a href="#conclusion">Conclusion</a>
          </aside>
          <article>
            <div className={styles.articleTop}>
              <div>
                <span className={styles.category}>Cloud Platforms</span>
                <h1>{renderDocument(current.content) && "Why We Chose PaaS Over IaaS: Understanding the Shared Responsibility Model"}</h1>
              </div>
              <button type="button" className={styles.editButton} onClick={openEditor}><Edit3 size={16} />Edit article</button>
            </div>
            <div className={styles.articleBody}>
              {renderDocument(articleContent)}
            </div>
            <footer className={styles.articleFooter}><div><span>Last edited by</span><strong>{current.editorName}</strong></div><div><span>Version</span><strong>{current.version}</strong></div><div><span>Last updated</span><strong>{new Date(current.createdAt).toLocaleString()}</strong></div></footer>
          </article>
        </main>
      )}
      {nameModal && <NameModal onContinue={continueEditing} onClose={() => setNameModal(false)} />}
      {adminChallenge && <AdminChallenge onClose={() => setAdminChallenge(false)} onAuthenticated={adminAuthenticated} />}
      <footer className={styles.siteFooter}><span><Cloud size={15} /> Cloud &amp; PaaS Reflection</span><button type="button" onClick={() => setAdminChallenge(true)}><ShieldCheck size={14} />Admin Access</button></footer>
    </div>
  );
}

function Header({ onArticle, onHistory, onAdmin }: { onArticle: () => void; onHistory: () => void; onAdmin: () => void }) {
  return (
    <header className={styles.header}>
      <button type="button" className={styles.brand} onClick={onArticle}><Cloud size={22} /><div><strong>Cloud &amp; PaaS Reflection</strong><small>IT 412 — Platform Technologies</small></div></button>
      <nav><button type="button" onClick={onArticle}>Article</button><button type="button" onClick={onHistory}><HistoryIcon size={15} />Version History</button></nav>
    </header>
  );
}
