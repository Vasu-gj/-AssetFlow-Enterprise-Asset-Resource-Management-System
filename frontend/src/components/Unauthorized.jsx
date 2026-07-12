import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
      <h1 className="text-4xl font-extrabold text-slate-900 mb-2">403 - Forbidden</h1>
      <p className="text-slate-600 mb-6 max-w-md">You do not have the required role authorizations to view this resource.</p>
      <Link to="/" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold shadow-md transition-colors duration-200">
        Return to Dashboard
      </Link>
    </div>
  );
};

export default Unauthorized;
