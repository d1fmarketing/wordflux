import { NextResponse } from "next/server";
import { getBoard } from "../../../lib/board.js";

export async function GET() {
  try{
    const board = await getBoard()
    return NextResponse.json({ board })
  } catch(err){
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
