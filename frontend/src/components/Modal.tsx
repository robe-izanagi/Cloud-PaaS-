import type { ReactNode } from "react";
import { X } from "lucide-react";
import styles from "../styles/modal.module.css";

export default function Modal({ title, children, onClose, closeDisabled }: { title: string; children: ReactNode; onClose?: () => void; closeDisabled?: boolean }) {
  return (
    <div className={styles.backdrop} role="presentation">
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.header}>
          <h2>{title}</h2>
          {onClose && <button type="button" aria-label="Close" onClick={onClose} disabled={closeDisabled}><X size={18} /></button>}
        </div>
        {children}
      </div>
    </div>
  );
}
