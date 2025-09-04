'use client'

export default function Error({ error, reset }) {
  return (
    <div style={{padding: '20px', fontFamily: 'system-ui'}}>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()} style={{padding: '10px 20px', cursor: 'pointer'}}>
        Try again
      </button>
    </div>
  )
}