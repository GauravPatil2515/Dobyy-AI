import { useSubscription } from '../contexts/SubscriptionContext.jsx'

export default function UpgradeModal({ onClose, onUpgrade }) {
  const { usage, subscription } = useSubscription()

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="upgrade-modal">
        <div className="upgrade-modal-header">
          <div className="upgrade-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2 className="modal-title">Daily Limit Reached</h2>
          <p className="modal-sub">
            You've used {usage.dailyCalls} of {subscription.dailyApiCalls} free AI designs today.
          </p>
        </div>

        <div className="upgrade-progress">
          <div className="upgrade-progress-row">
            <span>Free designs used today</span>
            <span className="upgrade-progress-count">{usage.dailyCalls} / {subscription.dailyApiCalls}</span>
          </div>
          <div className="upgrade-progress-bar">
            <div
              className="upgrade-progress-fill"
              style={{ width: `${(usage.dailyCalls / subscription.dailyApiCalls) * 100}%` }}
            />
          </div>
          <p className="upgrade-progress-note">Resets at midnight UTC</p>
        </div>

        <div className="upgrade-pro-card">
          <div className="upgrade-pro-header">
            <h3>Dobby Pro</h3>
            <span className="modal-badge">RECOMMENDED</span>
          </div>
          <p className="upgrade-pro-sub">Unlock unlimited creativity</p>
          <ul className="upgrade-features">
            <li><span className="modal-feature-icon" style={{color:'#10b981'}}>✓</span> 100 AI designs per day</li>
            <li><span className="modal-feature-icon" style={{color:'#10b981'}}>✓</span> Save up to 200 designs</li>
            <li><span className="modal-feature-icon" style={{color:'#10b981'}}>✓</span> WIF export for looms</li>
            <li><span className="modal-feature-icon" style={{color:'#10b981'}}>✓</span> Priority support</li>
          </ul>
          <div className="upgrade-pricing">
            <span className="upgrade-price">$9</span>
            <span className="upgrade-price-period">/month</span>
          </div>
        </div>

        <div className="upgrade-actions">
          <button className="modal-dismiss" onClick={onClose}>Maybe Later</button>
          <button className="modal-cta" onClick={onUpgrade}>Upgrade to Pro</button>
        </div>
      </div>
    </div>
  )
}
