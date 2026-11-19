import type { Pool, PoolConnection, ResultSetHeader } from "mysql2/promise";
import type { RevisionRow } from "../types/common.js";
import { defaultDocument, plainTextFromDocument, upgradeLegacyArchitectureDocument } from "./defaultArticle.js";

export class ArticleRepository {
  constructor(private pool: Pool) {}

  async initialize() {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(`CREATE TABLE IF NOT EXISTS articles (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        document_key VARCHAR(64) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        current_revision_id BIGINT UNSIGNED NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`);
      await conn.query(`CREATE TABLE IF NOT EXISTS article_revisions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        article_id BIGINT UNSIGNED NOT NULL,
        version_number INT UNSIGNED NOT NULL,
        editor_name VARCHAR(60) NOT NULL,
        content_json LONGTEXT NOT NULL,
        plain_text LONGTEXT NOT NULL,
        restored_from_revision_id BIGINT UNSIGNED NULL,
        is_original BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_article_version (article_id, version_number),
        INDEX idx_article_created (article_id, created_at)
      )`);
      const [articleRows] = await conn.query<any[]>("SELECT id FROM articles WHERE document_key = ? LIMIT 1", ["cloud-paas-reflection"]);
      let articleId: number;
      if (articleRows.length) articleId = articleRows[0].id;
      else {
        const [result] = await conn.query<ResultSetHeader>(
          "INSERT INTO articles (document_key, title) VALUES (?, ?)",
          ["cloud-paas-reflection", "Why We Chose PaaS Over IaaS: Understanding the Shared Responsibility Model"]
        );
        articleId = result.insertId;
      }
      const [originalRows] = await conn.query<any[]>("SELECT id FROM article_revisions WHERE article_id = ? AND is_original = TRUE LIMIT 1", [articleId]);
      if (!originalRows.length) {
        const content = JSON.stringify(defaultDocument);
        const [result] = await conn.query<ResultSetHeader>(
          "INSERT INTO article_revisions (article_id, version_number, editor_name, content_json, plain_text, is_original) VALUES (?, 1, 'Original', ?, ?, TRUE)",
          [articleId, content, plainTextFromDocument(defaultDocument)]
        );
        await conn.query("UPDATE articles SET current_revision_id = ? WHERE id = ?", [result.insertId, articleId]);
      } else {
        await conn.query("UPDATE articles SET current_revision_id = COALESCE(current_revision_id, ?) WHERE id = ?", [originalRows[0].id, articleId]);
      }
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async getArticle() {
    const [rows] = await this.pool.query<any[]>(`
      SELECT ar.id, ar.article_id, ar.version_number, ar.editor_name, ar.content_json, ar.plain_text,
             ar.restored_from_revision_id, ar.is_original, ar.created_at
      FROM articles a
      JOIN article_revisions ar ON ar.id = a.current_revision_id
      WHERE a.document_key = 'cloud-paas-reflection' LIMIT 1`);
    if (!rows.length) throw new Error("Article not initialized");
    const row = rows[0] as RevisionRow;
    return this.formatRevision(row);
  }

  async getRevisions() {
    const [rows] = await this.pool.query<RevisionRow[]>(`
      SELECT ar.* FROM articles a JOIN article_revisions ar ON ar.article_id = a.id
      WHERE a.document_key = 'cloud-paas-reflection'
      ORDER BY ar.version_number DESC`);
    return rows.map((row) => this.formatRevision(row));
  }

  async getRevision(id: number) {
    const [rows] = await this.pool.query<RevisionRow[]>(`
      SELECT ar.* FROM article_revisions ar
      JOIN articles a ON a.id = ar.article_id
      WHERE ar.id = ? AND a.document_key = 'cloud-paas-reflection' LIMIT 1`, [id]);
    return rows[0] ? this.formatRevision(rows[0]) : null;
  }

  async createRevision(editorName: string, content: any, expectedVersion: number) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const [articleRows] = await conn.query<any[]>("SELECT id, current_revision_id FROM articles WHERE document_key = ? LIMIT 1 FOR UPDATE", ["cloud-paas-reflection"]);
      if (!articleRows.length) throw new Error("Article not found");
      const [currentRows] = await conn.query<any[]>("SELECT version_number FROM article_revisions WHERE id = ? LIMIT 1", [articleRows[0].current_revision_id]);
      if (!currentRows.length) throw new Error("Current revision not found");
      if (Number(currentRows[0].version_number) !== expectedVersion) {
        await conn.rollback();
        return { conflict: true as const };
      }
      const [maxRows] = await conn.query<any[]>("SELECT MAX(version_number) AS max_version FROM article_revisions WHERE article_id = ?", [articleRows[0].id]);
      const version = Number(maxRows[0].max_version) + 1;
      const contentJson = JSON.stringify(content);
      const plainText = plainTextFromDocument(content);
      const [result] = await conn.query<ResultSetHeader>(
        "INSERT INTO article_revisions (article_id, version_number, editor_name, content_json, plain_text, is_original) VALUES (?, ?, ?, ?, ?, FALSE)",
        [articleRows[0].id, version, editorName, contentJson, plainText]
      );
      await conn.query("UPDATE articles SET current_revision_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [result.insertId, articleRows[0].id]);
      await conn.commit();
      return { conflict: false as const, revision: await this.getRevision(result.insertId) };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async restoreRevision(sourceId: number | null, sourceIsOriginal = false) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const [articleRows] = await conn.query<any[]>("SELECT id FROM articles WHERE document_key = ? LIMIT 1 FOR UPDATE", ["cloud-paas-reflection"]);
      if (!articleRows.length) throw new Error("Article not found");
      let source;
      if (sourceIsOriginal) {
        const [rows] = await conn.query<any[]>("SELECT * FROM article_revisions WHERE article_id = ? AND is_original = TRUE LIMIT 1", [articleRows[0].id]);
        source = rows[0];
      } else if (sourceId) {
        const [rows] = await conn.query<any[]>("SELECT * FROM article_revisions WHERE id = ? AND article_id = ? LIMIT 1", [sourceId, articleRows[0].id]);
        source = rows[0];
      }
      if (!source) {
        await conn.rollback();
        return null;
      }
      const [maxRows] = await conn.query<any[]>("SELECT MAX(version_number) AS max_version FROM article_revisions WHERE article_id = ?", [articleRows[0].id]);
      const version = Number(maxRows[0].max_version) + 1;
      const restoredContent = upgradeLegacyArchitectureDocument(
        typeof source.content_json === "string" ? JSON.parse(source.content_json) : source.content_json
      );
      const contentJson = JSON.stringify(restoredContent);
      const plainText = plainTextFromDocument(restoredContent);
      const [result] = await conn.query<ResultSetHeader>(
        "INSERT INTO article_revisions (article_id, version_number, editor_name, content_json, plain_text, restored_from_revision_id, is_original) VALUES (?, ?, 'Administrator', ?, ?, ?, FALSE)",
        [articleRows[0].id, version, contentJson, plainText, source.id]
      );
      await conn.query("UPDATE articles SET current_revision_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [result.insertId, articleRows[0].id]);
      await conn.commit();
      return this.getRevision(result.insertId);
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  private formatRevision(row: RevisionRow) {
    return {
      id: row.id,
      articleId: row.article_id,
      version: row.version_number,
      editorName: row.editor_name,
      content: typeof row.content_json === "string" ? JSON.parse(row.content_json) : row.content_json,
      plainText: row.plain_text,
      restoredFromRevisionId: row.restored_from_revision_id,
      isOriginal: Boolean(row.is_original),
      createdAt: row.created_at
    };
  }
}
