import Dexie, { type Table } from "dexie";
import type {
  Block,
  Exercise,
  MetricLog,
  Programme,
  ProgressionState,
  SessionLog,
  SessionTemplate,
  SetLog,
  VariationLadder
} from "./types";

export class SwingGainsDB extends Dexie {
  programme!: Table<Programme, string>;
  block!: Table<Block, string>;
  sessionTemplate!: Table<SessionTemplate, string>;
  exercise!: Table<Exercise, string>;
  variationLadder!: Table<VariationLadder, string>;
  sessionLog!: Table<SessionLog, string>;
  setLog!: Table<SetLog, string>;
  progressionState!: Table<ProgressionState, string>;
  metricLog!: Table<MetricLog, string>;

  constructor() {
    super("swing-gains");
    this.version(1).stores({
      programme: "id",
      block: "id, sequence",
      sessionTemplate: "id, blockId, venue, type",
      exercise: "id, venue, ladderId",
      variationLadder: "id, pattern",
      sessionLog: "id, templateId, date, originDevice",
      setLog: "id, sessionLogId, exerciseId",
      progressionState: "exerciseId",
      metricLog: "id, date, type, linkedSessionLogId"
    });
  }
}

export const db = new SwingGainsDB();
