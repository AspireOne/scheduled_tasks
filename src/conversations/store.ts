import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import { globalConfig } from "@/config";
import { logger } from "@/shared/logger";

const log = logger.withContext("conversations-store");

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS conversations (
    task_name   TEXT PRIMARY KEY,
    response_id TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );
`;

type ConversationRow = {
  task_name: string;
  response_id: string;
  updated_at: string;
};

let db: DatabaseSync | undefined;

function openStore(): DatabaseSync {
  if (db) return db;

  const dbPath = globalConfig.conversationsDbPath;
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  log.debug("Opening conversations DB", { dbPath });
  db = new DatabaseSync(dbPath);
  db.exec(SCHEMA);
  return db;
}

export function getResponseId(taskName: string): string | undefined {
  const stmt = openStore().prepare("SELECT response_id FROM conversations WHERE task_name = ?");
  const row = stmt.get(taskName) as Pick<ConversationRow, "response_id"> | undefined;
  return row?.response_id;
}

export function upsertResponseId(taskName: string, responseId: string): void {
  const stmt = openStore().prepare(
    `INSERT INTO conversations (task_name, response_id, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(task_name) DO UPDATE SET
       response_id = excluded.response_id,
       updated_at  = excluded.updated_at`,
  );
  stmt.run(taskName, responseId, new Date().toISOString());
}
