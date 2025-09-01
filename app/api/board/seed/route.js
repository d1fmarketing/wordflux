import { NextResponse } from "next/server";
import { seedIfMissing, getBoard } from "../../../lib/board.js";

export async function POST(){
  try{
    await seedIfMissing()
    const board = await getBoard()
    return NextResponse.json({ ok:true, board })
  } catch(err){
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
