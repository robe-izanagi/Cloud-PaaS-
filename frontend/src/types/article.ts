export interface TipTapDocument {
  type: "doc";
  content?: unknown[];
  [key: string]: unknown;
}

export interface Revision {
  id: number;
  articleId: number;
  version: number;
  editorName: string;
  content: TipTapDocument;
  plainText: string;
  restoredFromRevisionId: number | null;
  isOriginal: boolean;
  createdAt: string;
}
