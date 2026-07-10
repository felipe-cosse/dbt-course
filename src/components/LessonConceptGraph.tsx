import { ArrowRight } from 'lucide-react'
import type { LearningVisual } from '../data/learningGuides'

type LessonConceptGraphProps = {
  visual: LearningVisual
}

export function LessonConceptGraph({ visual }: LessonConceptGraphProps) {
  const titleId = `concept-graph-${visual.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <figure className="concept-visual" aria-labelledby={titleId}>
      <figcaption>
        <span>Visual model</span>
        <h2 id={titleId}>{visual.title}</h2>
        <p>{visual.caption}</p>
      </figcaption>
      <div className="concept-graph" role="img" aria-label={`${visual.title}: ${visual.nodes.join(' to ')}`}>
        {visual.nodes.map((node, index) => (
          <div className="concept-graph-segment" key={node}>
            <div className="concept-node">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{node}</strong>
            </div>
            {index < visual.nodes.length - 1 ? <ArrowRight className="concept-edge" size={18} aria-hidden="true" /> : null}
          </div>
        ))}
      </div>
    </figure>
  )
}
