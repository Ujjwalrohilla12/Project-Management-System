import { useEffect } from 'react';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Outlet } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loadTheme } from '../features/themeSlice';
import { Loader2Icon } from 'lucide-react';
import { useWorkspaces } from '../hooks/useWorkspaces.js';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const { loading } = useWorkspaces();

  useEffect(() => {
    dispatch(loadTheme());
  }, [dispatch]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
      <Loader2Icon className="size-7 text-blue-500 animate-spin" />
    </div>
  );

  return (
    <div className="flex bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col h-screen">
        <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
