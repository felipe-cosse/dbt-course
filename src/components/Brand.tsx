import { Braces } from 'lucide-react'

export function Brand() {
  return (
    <div className="brand" aria-label="DBT Forge home">
      <span className="brand-mark" aria-hidden="true">
        <Braces size={25} strokeWidth={2.4} />
        <span />
      </span>
      <span>DBT Forge</span>
    </div>
  )
}

