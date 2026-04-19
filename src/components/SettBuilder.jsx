export default function SettBuilder({ sett, dispatch }) {
  return (
    <div className="section">
      <div className="section-title">Sett Builder</div>

      <div className="sett-bar">
        {sett.flatMap((s,i) =>
          Array.from({length: s.n}, (_,j) => (
            <div key={`${i}-${j}`} style={{flex:1, background:s.c, minWidth:2}}/>
          ))
        )}
      </div>

      <div className="sett-strips">
        {sett.map((stripe, idx) => (
          <div key={idx} className="stripe-row">
            <div className="stripe-color" style={{background: stripe.c}}>
              <input type="color" value={stripe.c}
                onChange={e => dispatch({
                  type:'UPDATE_STRIPE', idx, patch:{c: e.target.value}
                })}/>
            </div>
            <input
              type="number"
              className="stripe-n"
              value={stripe.n}
              min={1} max={32}
              onChange={e => dispatch({
                type:'UPDATE_STRIPE', idx,
                patch:{n: Math.max(1, Math.min(32, +e.target.value))}
              })}/>
            <span className="stripe-label">{stripe.n}t</span>
            {sett.length > 1 && (
              <button
                className="stripe-del"
                onClick={() => dispatch({type:'REMOVE_STRIPE', idx})}>
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        className="btn-add"
        onClick={() => dispatch({type:'ADD_STRIPE'})}>
        ＋ Add Color Stripe
      </button>
    </div>
  )
}
