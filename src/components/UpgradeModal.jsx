import { useSubscription } from '../contexts/SubscriptionContext.jsx'

export default function UpgradeModal({ onClose, onUpgrade }) {
  const { usage, subscription, getRemainingCalls } = useSubscription()

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        maxWidth: '480px',
        width: '100%',
        padding: '32px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#1a1a2e'
          }}>
            Daily Limit Reached
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
            You've used {usage.dailyCalls} of {subscription.dailyApiCalls} free AI designs today.
          </p>
        </div>

        <div style={{
          background: '#f3f4f6',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '0.9rem'
          }}>
            <span style={{ color: '#6b7280' }}>Free designs used today</span>
            <span style={{ fontWeight: '500' }}>{usage.dailyCalls} / {subscription.dailyApiCalls}</span>
          </div>
          <div style={{
            height: '6px',
            background: '#e5e7eb',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${(usage.dailyCalls / subscription.dailyApiCalls) * 100}%`,
              background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '3px'
            }} />
          </div>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '8px' }}>
            Resets at midnight UTC
          </p>
        </div>

        <div style={{
          border: '2px solid #e5e7eb',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Dobby Pro</h3>
            <span style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '500'
            }}>
              RECOMMENDED
            </span>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '16px' }}>
            Unlock unlimited creativity
          </p>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            fontSize: '0.9rem',
            lineHeight: '2'
          }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#10b981' }}>✓</span> 100 AI designs per day
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#10b981' }}>✓</span> Save up to 200 designs
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#10b981' }}>✓</span> WIF export for looms
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#10b981' }}>✓</span> Priority support
            </li>
          </ul>
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: '#f3f4f6',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'baseline',
            gap: '4px'
          }}>
            <span style={{ fontSize: '1.5rem', fontWeight: '600' }}>$9</span>
            <span style={{ color: '#6b7280' }}>/month</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px 24px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              background: 'white',
              color: '#6b7280',
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Maybe Later
          </button>
          <button
            onClick={onUpgrade}
            style={{
              flex: 1,
              padding: '14px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  )
}
