import React from 'react';
import { FiBookOpen } from 'react-icons/fi';

const EmptyState = ({
  icon: Icon = FiBookOpen,
  title = 'No items found',
  message = 'There are no records matching your request at this moment.',
  actionButton = null,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 glass-panel rounded-2xl border border-slate-800 my-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md mb-6">{message}</p>
      {actionButton}
    </div>
  );
};

export default EmptyState;
