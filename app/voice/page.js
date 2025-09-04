'use client'
import { useEffect, useRef, useState } from 'react'

const COLORS = {
  magenta: '#e50c78',
  orange: '#ef450a',
  navy: '#000023',
  soft: '#fff9f9'
}

export default function Page() {
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [board, setBoard] = useState(null)
  const remoteAudioRef = useRef(null)
  const pcRef = useRef(null)
  const dcRef = useRef(null)
  const localStreamRef = useRef(null)

  // Fetch board from Dynamo
  async function loadBoard() {
    const r = await fetch('/api/board/get')
    const j = await r.json()
    setBoard(j.board)
  }

  useEffect(() => { loadBoard() }, [])

  async function connectVoice() {
    try{
      setConnecting(true)
      const local = await navigator.mediaDevices.getUserMedia({ audio:true })
      localStreamRef.current = local

      const tokenRes = await fetch('/api/realtime/token')
      if(!tokenRes.ok) throw new Error('Failed to get realtime token')
      const tokenJson = await tokenRes.json()
      const token = tokenJson?.client_secret?.value || tokenJson?.token
      if(!token) throw new Error('Missing token in response')

      const pc = new RTCPeerConnection()
      pcRef.current = pc
      pc.ontrack = (e) => { if(remoteAudioRef.current){ remoteAudioRef.current.srcObject = e.streams[0] } }
      local.getTracks().forEach(t => pc.addTrack(t, local))

      const dc = pc.createDataChannel('oai-events')
      dcRef.current = dc
      dc.onopen = () => { setConnected(true); setConnecting(false); /* seed context */ sendBoardSnapshotToAgent() }
      dc.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data)
          // You can log these in devtools for debugging
          // console.log('<<', msg)
        } catch {}
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const sdpResp = await fetch('https://api.openai.com/v1/realtime?model=' + (process.env.NEXT_PUBLIC_OPENAI_REALTIME_MODEL || 'gpt-realtime'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/sdp' },
        body: offer.sdp
      })
      const answer = await sdpResp.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answer })
    }catch(err){
      console.error(err)
      alert(err.message)
      setConnecting(false)
      setConnected(false)
    }
  }

  async function hangUp(){
    try{
      dcRef.current?.close()
      pcRef.current?.close()
      localStreamRef.current?.getTracks().forEach(t=>t.stop())
    } finally {
      setConnected(false)
      setConnecting(false)
    }
  }

  // Send the current board as context to the model so it can suggest improvements
  function sendBoardSnapshotToAgent(){
    if(!dcRef.current || !board) return
    const content = [
      { type: 'input_text', text: `You are the WordFlux agent. Current board JSON follows. Suggest improvements (merge columns, set WIP limits, move cards). Keep suggestions concise.\nBOARD_JSON:\n${JSON.stringify(board)}` }
    ]
    dcRef.current.send(JSON.stringify({ type: 'conversation.item.create', item: { type:'message', role:'user', content } }))
    dcRef.current.send(JSON.stringify({ type: 'response.create' }))
  }

  async function handleImage(file){
    const base64 = await fileToDataURL(file)
    dcRef.current?.send(JSON.stringify({
      type:'conversation.item.create',
      item:{ type:'message', role:'user', content:[{ type:'input_image', image_url: base64 }] }
    }))
    dcRef.current?.send(JSON.stringify({ type:'response.create' }))
  }

  function onDrop(e){
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files||[])
    for(const f of files){ if(f.type.startsWith('image/')) handleImage(f) }
  }

  async function apply(op, args){
    const r = await fetch('/api/board/apply', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ op, args })
    })
    const j = await r.json()
    setBoard(j.board)
    // Nudge agent with updated snapshot
    sendBoardSnapshotToAgent()
  }

  return (
    <div>
      <header className="container" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span className="badge">WORD<strong>FLUX</strong></span>
          <span style={{opacity:.6}}>Clarity in motion</span>
        </div>
        <div style={{display:'flex',gap:8}}>
          {!connected ? (
            <button className="pill" onClick={connectVoice}>{connecting?'Connecting…':'Connect voice'}</button>
          ) : (
            <button className="pill" onClick={hangUp}>Hang up</button>
          )}
        </div>
      </header>

      <div className="container" style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:16}}>
        {/* Left Agent Panel */}
        <aside className="card" style={{padding:16}}>
          <div className="gradient" style={{padding:12,borderRadius:16,boxShadow:'0 10px 40px rgba(229,12,120,.25)'}}>
            <div style={{fontWeight:700,fontSize:14,display:'flex',alignItems:'center',gap:8}}>
              <span>Agent</span>
              <span style={{opacity:.85,fontWeight:500}}>— Minimalist co‑pilot</span>
            </div>
            <p style={{margin:'6px 0 0',opacity:.9,fontSize:13}}>Organizes the board, suggests changes, and talks.</p>
            <audio ref={remoteAudioRef} autoPlay />
          </div>

          <div onDragOver={(e)=>e.preventDefault()} onDrop={onDrop}
               className="card" style={{padding:16,marginTop:12,borderStyle:'dashed'}}>
            <div style={{fontSize:14,opacity:.9}}>Drop screenshots here</div>
            <p style={{fontSize:12,opacity:.7,marginTop:6}}>The agent will read the image and propose changes.</p>
            <hr/>
            <label className="pill" style={{display:'inline-flex',gap:8,alignItems:'center'}}>
              <input type="file" accept="image/*" style={{display:'none'}} onChange={(e)=>e.target.files&&handleImage(e.target.files[0])}/>
              Add image
            </label>
          </div>

          <div style={{marginTop:12}}>
            <div style={{fontSize:11,letterSpacing:1,textTransform:'uppercase',opacity:.55}}>Quick actions</div>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
              <button className="pill" onClick={()=>apply('set_wip_limit',{ columnId:'Doing', limit:3 })}>Set WIP Doing → 3</button>
              <button className="pill" onClick={()=>apply('move_card',{ fromColumnId:'Doing', toColumnId:'Done', cardId:'doing-1' })}>Move first Doing → Done</button>
              <button className="pill" onClick={()=>apply('merge_columns',{ sourceId:'Backlog', targetId:'Doing', newName:'Plan' })}>Merge Backlog + Doing → Plan</button>
            </div>
          </div>
        </aside>

        {/* Right Board */}
        <main>
          {!board ? (
            <div className="card" style={{padding:16}}>Loading board…</div>
          ) : (
            <div style={{display:'grid',gap:16,gridTemplateColumns:'repeat(3, minmax(260px, 1fr))'}}>
              {board.columns.map((col) => (
                <section key={col.id} className="card" style={{padding:12}}>
                  <header style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{fontWeight:600}}>{col.name}</div>
                    <span className="pill">WIP: {board.wipLimits?.[col.id] ?? '—'}</span>
                  </header>
                  <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:8}}>
                    {col.cards.map((c) => (
                      <article key={c.id} className="card" style={{padding:12,background:'#000028'}}>
                        <div style={{fontSize:14,fontWeight:600}}>{c.title}</div>
                        <div style={{fontSize:12,opacity:.7,marginTop:4}}>{c.desc}</div>
                        <div style={{marginTop:8,display:'flex',gap:6,opacity:.7,fontSize:11}}>
                          <span className="pill">owner: {c.owner}</span>
                          <span className="pill">priority: {c.priority}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

async function fileToDataURL(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
