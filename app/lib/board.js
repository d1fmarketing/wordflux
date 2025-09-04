import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const TABLE = process.env.DYNAMO_TABLE || "Wordflux";
const PK = process.env.BOARD_PK || "board#default";
const REGION = process.env.AWS_REGION || "us-west-2";

// Progressive enhancement: if AWS config is missing, fall back to in-memory store
const useInMemory = !process.env.AWS_REGION || !process.env.DYNAMO_TABLE;
let memoryStore = null;

let ddb;
if (!useInMemory) {
  const client = new DynamoDBClient({ region: REGION });
  ddb = DynamoDBDocumentClient.from(client);
}

export async function getBoard(autoSeed=false){
  if (useInMemory) {
    if (!memoryStore && autoSeed) {
      await seedIfMissing();
    }
    if (!memoryStore) throw new Error("Board not found. Run /api/board/seed or configure AWS.");
    return memoryStore;
  }
  try{
    const r = await ddb.send(new GetCommand({ TableName: TABLE, Key: { pk: PK } }))
    if(!r.Item){
      if(autoSeed){
        await seedIfMissing()
        return getBoard(false)
      }
      throw new Error("Board not found. Run /api/board/seed or set autoSeed.")
    }
    return r.Item.data
  } catch(err){
    // Fallback to memory if AWS is unavailable
    if (autoSeed && !memoryStore) {
      await seedIfMissing()
    }
    if (!memoryStore) throw err
    return memoryStore
  }
}

export async function putBoard(board){
  if (useInMemory) {
    memoryStore = JSON.parse(JSON.stringify(board));
    return;
  }
  try{
    await ddb.send(new PutCommand({ TableName: TABLE, Item: { pk: PK, data: board, updatedAt: Date.now() } }))
  } catch {
    memoryStore = JSON.parse(JSON.stringify(board));
  }
}

export async function seedIfMissing(){
  const sample = {
    id: "default",
    wipLimits: { Doing: 4 },
    columns: [
      {
        id: "Backlog",
        name: "Backlog",
        cards: [
          { id: "backlog-1", title: "Define flow stages", desc: "Map statuses and entry/exit rules.", owner: "rj", priority: "m" },
          { id: "backlog-2", title: "Add Slack integration", desc: "Notify on column change.", owner: "augusto", priority: "l" }
        ]
      },
      {
        id: "Doing",
        name: "Doing",
        cards: [
          { id: "doing-1", title: "Auto-move on Approve", desc: "When approved → Deploy + notify.", owner: "rj", priority: "h" },
          { id: "doing-2", title: "Screenshot parser", desc: "Let agent read screenshots.", owner: "lucas", priority: "m" }
        ]
      },
      {
        id: "Done",
        name: "Done",
        cards: [
          { id: "done-1", title: "Brand tokens", desc: "Colors, gradients, radius.", owner: "isa", priority: "m" }
        ]
      }
    ]
  }
  await putBoard(sample)
}

export function envStatus(){
  return {
    hasAwsRegion: !!process.env.AWS_REGION,
    hasDynamoTable: !!process.env.DYNAMO_TABLE,
    inMemory: useInMemory,
  };
}
