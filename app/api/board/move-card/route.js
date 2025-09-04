import { NextResponse } from 'next/server'
import { getBoard, putBoard } from '../../../lib/board.js'

export async function POST(req){
  try{
    const { fromColumnId, toColumnId, cardId, position } = await req.json()
    let board = await getBoard(true)
    const from = board.columns.find(c=>c.id===fromColumnId)
    const to   = board.columns.find(c=>c.id===toColumnId)
    if(!from || !to) throw new Error('Invalid column(s)')
    const idx = from.cards.findIndex(c=>c.id===cardId)
    if(idx<0) throw new Error('Card not found')
    const [card] = from.cards.splice(idx,1)
    if(position != null && position >=0 && position <= to.cards.length){
      to.cards.splice(position,0,card)
    } else {
      to.cards.push(card)
    }
    await putBoard(board)
    return NextResponse.json({ ok:true, board })
  } catch(err){
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

