import { Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import { Toaster } from "react-hot-toast";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Team from "./pages/Team";
import ProjectDetails from "./pages/ProjectDetails";
import TaskDetails from "./pages/TaskDetails";
import { SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";

const App = () => {
    return (
        <>
            <Toaster />
            <SignedIn>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="team" element={<Team />} />
                        <Route path="projects" element={<Projects />} />
                        <Route path="projectsDetail" element={<ProjectDetails />} />
                        <Route path="taskDetails" element={<TaskDetails />} />
                    </Route>
                </Routes>
            </SignedIn>
            <SignedOut>
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
                    <div className="w-full max-w-md">
                        <SignIn />
                    </div>
                </div>
            </SignedOut>
        </>
    );
};

export default App;