import ArchitectureFlow from "./ArchitectureFlow";
import type { ArchitectureDiagramData } from "../types/diagram";
import { defaultDiagram } from "../utils/diagramModel";
import styles from "../styles/diagram.module.css";

export default function ArchitectureDiagram({ diagram = defaultDiagram }: { diagram?: ArchitectureDiagramData }) {
  return (
    <section className={styles.readOnlyDiagram} aria-label="System architecture">
      <ArchitectureFlow diagram={diagram} />
    </section>
  );
}
