import { NextResponse } from "next/server";
import { getBoard, putBoard } from "../../../lib/board.js";

export async function POST(req){
  try{
    const { op, args } = await req.json()
    let board = await getBoard(true) // auto-seed if missing

    if(op === 'set_wip_limit'){
      const { columnId, limit } = args
      board.wipLimits = board.wipLimits || {}
      board.wipLimits[columnId] = limit
    } else if(op === 'move_card'){
      const { fromColumnId, toColumnId, cardId, position } = args
      const from = board.columns.find(c=>c.id===fromColumnId)
      const to = board.columns.find(c=>c.id===toColumnId)
      if(!from || !to) throw new Error('Invalid column(s)')
      const idx = from.cards.findIndex(c=>c.id===cardId)
      if(idx<0) throw new Error('Card not found')
      const [card] = from.cards.splice(idx,1)
      if(position != null && position >=0 && position <= to.cards.length){
        to.cards.splice(position,0,card)
      } else {
        to.cards.push(card)
      }
    } else if(op === 'merge_columns'){
      const { sourceId, targetId, newName } = args
      const srcIdx = board.columns.findIndex(c=>c.id===sourceId)
      const tgtIdx = board.columns.findIndex(c=>c.id===targetId)
      if(srcIdx<0 || tgtIdx<0) throw new Error('Invalid column(s)')
      const src = board.columns[srcIdx]
      const tgt = board.columns[tgtIdx]
      tgt.cards = [...src.cards, ...tgt.cards]
      if(newName){ tgt.name = newName; tgt.id = newName }
      board.columns.splice(srcIdx,1)
      // Clean any WIP for removed column
      if(board.wipLimits){ delete board.wipLimits[sourceId] }
    } else {
      throw new Error('Unknown op')
    }

    await putBoard(board)
    return NextResponse.json({ ok: true, board })
  } catch(err){
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
