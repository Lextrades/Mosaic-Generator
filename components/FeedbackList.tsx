import React, { useState } from 'react';
import type { Feedback } from '../App';
import { StarRating } from './StarRating';

interface FeedbackListProps {
  feedbackList: Feedback[];
}

export const FeedbackList: React.FC<FeedbackListProps> = ({ feedbackList }) => {
  const [showAll, setShowAll] = useState(false);

  if (feedbackList.length === 0) {
    return null;
  }

  const latestFeedback = feedbackList[0];
  const displayedFeedbacks = showAll ? feedbackList : [latestFeedback];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) + ' Uhr';
  };

  return (
    <div className="mt-6 border-t border-slate-700 pt-6">
      <h3 className="text-xl font-bold text-slate-200 mb-4">Letztes Feedback</h3>
      <div className="space-y-4">
        {displayedFeedbacks.map((feedback, index) => (
          <div key={index} className="bg-slate-900/70 p-4 rounded-lg border border-slate-700">
            <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <p className="font-semibold text-slate-200 truncate" title={feedback.name}>{feedback.name}</p>
                <StarRating rating={feedback.rating} size="sm" disabled />
              </div>
              <p className="text-xs text-slate-500 flex-shrink-0 text-right">
                {formatDate(feedback.date)}
                {feedback.location && <span className="block">{feedback.location}</span>}
              </p>
            </div>
            {feedback.message && (
                <p className="text-slate-300 whitespace-pre-wrap">{feedback.message}</p>
            )}
            {!feedback.message && feedback.rating > 0 && (
                <p className="text-slate-500 italic">Keine Nachricht hinterlassen.</p>
            )}
          </div>
        ))}
      </div>
      {feedbackList.length > 1 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sky-400 hover:text-sky-300 text-sm font-semibold mt-4"
        >
          {showAll ? 'Weniger anzeigen' : `Alle ${feedbackList.length} anzeigen`}
        </button>
      )}
    </div>
  );
};
