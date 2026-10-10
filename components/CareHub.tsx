import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import DiseaseGuide from './DiseaseGuide';
import GovSupport from './GovSupport';
import FeedPlan from './FeedPlan';
import PlansPage from './PlansPage';
import VaccinesPage from './VaccinesPage';
import { VoiceHealthLog } from './VoiceHealthLog';

interface Props {
  profile: UserProfile;
  initialSubPage?: string;
}

const careSubPages = [
  { id: 'vaccines', label: 'Vaccines' },
  { id: 'voice', label: '🎙️ Voice log' },
  { id: 'disease', label: 'Disease guide' },
  { id: 'feed', label: 'Feed plan' },
  { id: 'govt', label: 'Gov support' },
  { id: 'plans', label: 'Plans' },
];

const CareHub: React.FC<Props> = ({ profile, initialSubPage = 'vaccines' }) => {
  const [subPage, setSubPage] = useState<string>(initialSubPage);

  useEffect(() => {
    if (initialSubPage) {
      setSubPage(initialSubPage);
    }
  }, [initialSubPage]);

  const renderSubPage = () => {
    switch (subPage) {
      case 'voice':
        return <VoiceHealthLog profile={profile} />;
      case 'disease':
        return <DiseaseGuide profile={profile} />;
      case 'feed':
        return <FeedPlan profile={profile} />;
      case 'govt':
        return <GovSupport profile={profile} />;
      case 'plans':
        return <PlansPage profile={profile} />;
      case 'vaccines':
      default:
        return <VaccinesPage profile={profile} />;
    }
  };

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-400">
      {/* Subpage Navigation Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {careSubPages.map(item => (
          <button
            key={item.id}
            onClick={() => setSubPage(item.id)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-sm"
            style={subPage === item.id
              ? { backgroundColor: '#1a3c2b', color: 'white' }
              : { backgroundColor: 'white', color: '#374151', border: '1px solid #e5e7eb' }
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Selected Care Tool Screen */}
      <div>
        {renderSubPage()}
      </div>
    </div>
  );
};

export default CareHub;
