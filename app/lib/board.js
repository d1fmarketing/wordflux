import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const TABLE = process.env.DYNAMO_TABLE || "Wordflux";
const PK = process.env.BOARD_PK || "board#default";
const REGION = process.env.AWS_REGION || "us-west-2";

const client = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(client);

export async function getBoard(autoSeed=false){
  const r = await ddb.send(new GetCommand({ TableName: TABLE, Key: { pk: PK } }))
  if(!r.Item){
    if(autoSeed){
      await seedIfMissing()
      return getBoard(false)
    }
    throw new Error("Board not found. Run /api/board/seed or set autoSeed.")
  }
  return r.Item.data
}

export async function putBoard(board){
  await ddb.send(new PutCommand({ TableName: TABLE, Item: { pk: PK, data: board, updatedAt: Date.now() } }))
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
          { id: "doing-1", title: "Auto‑move on Approve", desc: "When approved → Deploy + notify.", owner: "rj", priority: "h" },
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
