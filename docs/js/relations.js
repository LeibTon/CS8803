// Relation vocabulary shared by every scenario (Table 1 of the proposal).
// Pure data: imported by both the browser app and the offline scoring script.

export const RELATIONS = [
  { id: 'produces',  label: 'produces',      meaning: 'A creates, carries out or brings about B', example: 'Beavers → Dams',               color: '#1f6fb2', dash: null,  marker: 'arrow'  },
  { id: 'requires',  label: 'requires',      meaning: 'A cannot happen or exist unless B has',    example: 'Grade → Sign-off',             color: '#7b4fb0', dash: '5 4', marker: 'arrow'  },
  { id: 'prevents',  label: 'prevents',      meaning: 'A stops B from happening',                 example: 'Late upload → Grade',          color: '#d4622a', dash: null,  marker: 'bar'    },
  { id: 'increases', label: 'increases (+)', meaning: 'More of A leads to more of B',             example: 'Ponds → Trout',                color: '#13906b', dash: null,  marker: 'arrow'  },
  { id: 'decreases', label: 'decreases (−)', meaning: 'More of A leads to less of B',             example: 'Wolves → Coyotes',             color: '#d4622a', dash: '5 4', marker: 'arrow'  },
  { id: 'is_a',      label: 'is a',          meaning: 'A is an instance or a kind of B',          example: 'Email notice → Written notice', color: '#5b5f66', dash: null,  marker: 'hollow' },
];

export const REL = Object.fromEntries(RELATIONS.map((r) => [r.id, r]));
