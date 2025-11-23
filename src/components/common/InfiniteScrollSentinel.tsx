/**
 * Invisible element that triggers infinite scroll when visible
 */

import React from 'react';

interface InfiniteScrollSentinelProps {
  sentinelRef: React.RefObject<HTMLDivElement>;
  loading?: boolean;
  hasMore?: boolean;
}

export const InfiniteScrollSentinel: React.FC<InfiniteScrollSentinelProps> = ({
  sentinelRef,
  loading = false,
  hasMore = true
}) => {
  return (
    <div
      ref={sentinelRef}
      style={{
        height: '1px',
        width: '100%',
        visibility: 'hidden'
      }}
      aria-hidden="true"
    >
      {/* Invisible sentinel for intersection observer */}
    </div>
  );
};