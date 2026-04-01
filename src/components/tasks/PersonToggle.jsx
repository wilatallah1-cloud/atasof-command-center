export default function PersonToggle({ value, onChange }) {
  const options = ['William', 'Fadi', 'All']
  return (
    <div className="person-toggle">
      {options.map(opt => (
        <button
          key={opt}
          className={`person-toggle-btn${value === opt.toLowerCase() ? ' active' : ''}`}
          onClick={() => onChange(opt.toLowerCase())}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
