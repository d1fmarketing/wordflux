import { NextResponse } from "next/server";
import { getBoard, putBoard } from "../../../lib/board.js";

export async function POST(req){
  try{
    const { op, args } = await req.json()
    let board = await getBoard(true)

    if(op === 'set_wip_limit'){
      const { columnId, limit } = args
      board.wipLimits = board.wipLimits || {}
      board.wipLimits[columnId] = limit

    } else if(op === 'move_card'){
      const { fromColumnId, toColumnId, cardId, position } = args
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
      if(board.wipLimits){ delete board.wipLimits[sourceId] }

    } else if(op === 'add_card'){
      const { columnId, title, desc = '', owner = '', priority = 'l', id } = args
      const col = board.columns.find(c=>c.id===columnId)
      if(!col) throw new Error('Invalid column')
      const cid = id || ((title||'new').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,20) + '-' + Date.now())
      col.cards.push({ id: cid, title: title || 'New Card', desc, owner, priority })

    } else if(op === 'update_card'){
      const { columnId, cardId, title, desc, owner, priority } = args
      const col = board.columns.find(c=>c.id===columnId)
      if(!col) throw new Error('Invalid column')
      const card = col.cards.find(c=>c.id===cardId)
      if(!card) throw new Error('Card not found')
      if(title!=null) card.title = title
      if(desc!=null) card.desc = desc
      if(owner!=null) card.owner = owner
      if(priority!=null) card.priority = priority

    } else if(op === 'add_column'){
      const { id, name } = args
      const cid = id || (name||'New').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,20)
      if(board.columns.some(c=>c.id===cid)) throw new Error('Column id already exists')
      board.columns.push({ id: cid, name: name || 'New', cards: [] })

    } else if(op === 'rename_column'){
      const { columnId, newName } = args
      const col = board.columns.find(c=>c.id===columnId)
      if(!col) throw new Error('Invalid column')
      const newId = (newName||'Column').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,20)
      if(newId !== columnId && board.columns.some(c=>c.id===newId)) throw new Error('Column id already exists')
      // Update wipLimits key if exists
      if(board.wipLimits && Object.prototype.hasOwnProperty.call(board.wipLimits, columnId)){
        board.wipLimits[newId] = board.wipLimits[columnId]
        delete board.wipLimits[columnId]
      }
      col.id = newId
      col.name = newName || col.name

    } else if(op === 'delete_column'){
      const { columnId } = args
      const idx = board.columns.findIndex(c=>c.id===columnId)
      if(idx<0) throw new Error('Invalid column')
      board.columns.splice(idx,1)
      if(board.wipLimits){ delete board.wipLimits[columnId] }

    } else if(op === 'delete_card'){
      const { columnId, cardId } = args
      const col = board.columns.find(c=>c.id===columnId)
      if(!col) throw new Error('Invalid column')
      const idx = col.cards.findIndex(c=>c.id===cardId)
      if(idx<0) throw new Error('Card not found')
      col.cards.splice(idx,1)

    } else if(op === 'duplicate_card'){
      const { columnId, cardId } = args
      const col = board.columns.find(c=>c.id===columnId)
      if(!col) throw new Error('Invalid column')
      const card = col.cards.find(c=>c.id===cardId)
      if(!card) throw new Error('Card not found')
      const copy = { ...card, id: `${card.id}-copy-${Date.now()}`, title: `${card.title} (copy)` }
      col.cards.push(copy)

    } else if(op === 'move_column'){
      const { fromIndex, toIndex } = args
      if(fromIndex == null || toIndex == null) throw new Error('Invalid indices')
      if(fromIndex < 0 || fromIndex >= board.columns.length) throw new Error('Invalid fromIndex')
      if(toIndex < 0 || toIndex >= board.columns.length) throw new Error('Invalid toIndex')
      const [moved] = board.columns.splice(fromIndex, 1)
      board.columns.splice(toIndex, 0, moved)

    } else {
      throw new Error('Unknown op')
    }

    await putBoard(board)
    return NextResponse.json({ ok: true, board })
  } catch(err){
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
