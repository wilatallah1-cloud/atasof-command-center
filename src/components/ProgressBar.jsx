export default function ProgressBar({ current, target, label, showFraction = true }) {
  const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0

  return (
    <div className="stack-sm">
      {label && (
        <div className="row-between">
          <span style={{ fontSize: 13 }}>{label}</span>
          {showFraction && (
            <span className="mono small muted">{current}/{target}</span>
          )}
        </div>
      )}
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
