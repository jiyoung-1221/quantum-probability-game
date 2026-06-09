import { useMemo, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { conceptAreas } from '../data/concepts';
import { AssessmentGame } from '../features/assessment/AssessmentGame';
import { ConceptHub } from '../features/hub/ConceptHub';

export function App() {
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [completedConceptIds, setCompletedConceptIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);

  const selectedConcept = useMemo(
    () => conceptAreas.find((concept) => concept.id === selectedConceptId),
    [selectedConceptId],
  );

  const markComplete = (conceptId: string) => {
    const nextCompletedConceptIds = new Set(completedConceptIds).add(conceptId);

    setCompletedConceptIds(nextCompletedConceptIds);
    setSelectedConceptId(null);

    if (
      completedConceptIds.size < conceptAreas.length &&
      nextCompletedConceptIds.size === conceptAreas.length
    ) {
      setIsCelebrationOpen(true);
    }
  };

  const restartExploration = () => {
    setCompletedConceptIds(new Set());
    setSelectedConceptId(null);
    setIsCelebrationOpen(false);
  };

  return (
    <AppLayout>
      {selectedConcept ? (
        <AssessmentGame
          concept={selectedConcept}
          onBackToHub={() => setSelectedConceptId(null)}
          onComplete={() => markComplete(selectedConcept.id)}
        />
      ) : (
        <ConceptHub
          completedConceptIds={completedConceptIds}
          concepts={conceptAreas}
          isCelebrationOpen={isCelebrationOpen}
          onCloseCelebration={() => setIsCelebrationOpen(false)}
          onRestartExploration={restartExploration}
          onSelectConcept={setSelectedConceptId}
        />
      )}
    </AppLayout>
  );
}
