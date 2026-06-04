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

  const selectedConcept = useMemo(
    () => conceptAreas.find((concept) => concept.id === selectedConceptId),
    [selectedConceptId],
  );

  const markComplete = (conceptId: string) => {
    setCompletedConceptIds((current) => new Set(current).add(conceptId));
    setSelectedConceptId(null);
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
          onSelectConcept={setSelectedConceptId}
        />
      )}
    </AppLayout>
  );
}
