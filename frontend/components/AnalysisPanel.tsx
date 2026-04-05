'use client'
import ReactMarkdown from 'react-markdown'

interface Props {
  analysis: string
  loading: boolean
}

export default function AnalysisPanel({ analysis, loading }: Props) {
  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[80, 60, 90, 50, 70].map((w, i) => (
          <div key={i} style={{
            height: '12px', width: `${w}%`,
            background: '#18181b', borderRadius: '4px',
            animation: 'pulse 1.5s ease-in-out infinite',
            animationDelay: `${i * 0.1}s`,
          }} />
        ))}
        <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }`}</style>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <p style={{ color: '#52525b', fontSize: '13px' }}>Analysis will appear here</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', overflowY: 'auto', height: '100%' }}>
      <div className="analysis-content">
        <ReactMarkdown>{analysis}</ReactMarkdown>
      </div>
    </div>
  )
}
