import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'orange', subtitle }) => {
  const colorStyles = {
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    indigo: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    purple: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
        <h3 className="text-2xl font-extrabold text-slate-100">{value}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3.5 rounded-2xl border ${colorStyles[color] || colorStyles.indigo}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

export default StatCard;
