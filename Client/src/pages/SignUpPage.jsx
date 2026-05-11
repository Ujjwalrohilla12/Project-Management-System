import { SignUp } from '@clerk/clerk-react';
import { ShieldCheckIcon } from 'lucide-react';

const SignUpPage = () => {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-zinc-950">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex-col justify-center items-center p-12 text-white">
        <div className="max-w-md text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <ShieldCheckIcon className="size-10" />
            <h1 className="text-4xl font-bold tracking-tight">AegisFlow</h1>
          </div>
          <p className="text-xl text-blue-100 mb-6 leading-relaxed">
            Join thousands of teams managing projects smarter.
          </p>
          <div className="space-y-4 text-left">
            {[
              'Free to get started — no credit card required',
              'Invite your team in seconds',
              'Secure, role-based access control',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-blue-100">
                <div className="size-2 rounded-full bg-blue-300 flex-shrink-0" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <ShieldCheckIcon className="size-7 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">AegisFlow</span>
          </div>
          <SignUp
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl',
                headerTitle: 'text-gray-900 dark:text-white',
                headerSubtitle: 'text-gray-500 dark:text-zinc-400',
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
                footerActionLink: 'text-blue-600 hover:text-blue-700',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
