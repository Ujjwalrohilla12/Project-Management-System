import { Loader2Icon, ShieldCheckIcon } from 'lucide-react';

const AuthLoading = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 gap-4">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheckIcon className="size-8 text-blue-600" />
        <span className="text-2xl font-bold text-gray-900 dark:text-white">AegisFlow</span>
      </div>
      <Loader2Icon className="size-6 text-blue-500 animate-spin" />
      <p className="text-sm text-gray-500 dark:text-zinc-400">Verifying your session...</p>
    </div>
  );
};

export default AuthLoading;
