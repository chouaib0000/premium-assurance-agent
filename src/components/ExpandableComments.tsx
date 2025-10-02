import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

interface ExpandableCommentsProps {
  comments: string;
  maxLength?: number;
  className?: string;
}

const ExpandableComments: React.FC<ExpandableCommentsProps> = ({ 
  comments, 
  maxLength = 150, 
  className = "" 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!comments || comments.trim().length === 0) {
    return (
      <div className={`text-sm text-gray-500 italic ${className}`}>
        Aucun commentaire
      </div>
    );
  }

  const shouldTruncate = comments.length > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? comments.substring(0, maxLength) + '...' 
    : comments;

  return (
    <div className={`${className}`}>
      <div className="flex items-start gap-2">
        <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {displayText}
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-700 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Voir moins
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Voir plus
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpandableComments;