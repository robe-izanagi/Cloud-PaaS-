import { useState, type FormEvent } from "react";
import Modal from "./Modal";
import styles from "../styles/modal.module.css";

export default function NameModal({ onContinue, onClose }: { onContinue: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Please enter your name.");
    if (trimmed.length > 60) return setError("Name must be 60 characters or fewer.");
    onContinue(trimmed);
  };
  return (
    <Modal title="Before editing this document, please enter your name." onClose={onClose}>
      <form onSubmit={submit} className={styles.form}>
        <label htmlFor="editor-name">Your Name (required)</label>
        <input id="editor-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.primary}>Continue Editing</button>
      </form>
    </Modal>
  );
}
