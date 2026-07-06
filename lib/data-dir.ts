import path from "path";
import fs from "fs";
import os from "os";

const DATA_DIR = process.env.WORKPLAN_DATA_DIR
  ?? path.join(os.homedir(), ".workplan");

export function getDataDir(): string {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`[WorkPlan] Created data dir: ${DATA_DIR}`);
  }
  return DATA_DIR;
}

export function getDbPath(): string {
  return path.join(getDataDir(), "workplan.db");
}

export function getDbUrl(): string {
  return `file:${getDbPath()}`;
}
