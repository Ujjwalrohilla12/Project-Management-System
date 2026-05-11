import { useNavigate } from 'react-router-dom';
import { ShieldOffIcon, ArrowLeftIcon } from 'lucide-react';

const UnauthorizedPage = ({ message }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-red-100 dark:bg-red-500/10">
            <ShieldOffIcon className="size-12 text-red-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h1>
        <p className="text-gray-500 dark:text-zinc-400 mb-8 text-sm leading-relaxed">
          {message || "You don't have permission to view this page. Contact your workspace admin if you think this is a mistake."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 text-sm transition"
          >
            <ArrowLeftIcon className="size-4" /> Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
