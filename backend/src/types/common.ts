import type { RowDataPacket } from "mysql2/promise";

export type ReturnType<T> = T;
export interface RevisionRow extends RowDataPacket {
  id: number;
  article_id: number;
  version_number: number;
  editor_name: string;
  content_json: string;
  plain_text: string;
  restored_from_revision_id: number | null;
  is_original: number;
  created_at: Date;
}
