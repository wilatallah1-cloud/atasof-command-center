export default function PhaseTracker({ phases, currentPhase }) {
  return (
    <div className="pipeline">
      {phases.map((phase, i) => {
        const name = typeof phase === 'string' ? phase : phase.name
        let cls = 'pipeline-step'
        if (i < currentPhase) cls += ' completed'
        if (i === currentPhase) cls += ' active'
        return <div className={cls} key={i}>{name}</div>
      })}
    </div>
  )
}
