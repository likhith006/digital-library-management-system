import React from 'react';
import { BiLoaderAlt } from 'react-icons/bi';

const LoadingSpinner = ({ text = 'Loading data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <BiLoaderAlt className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-400">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
