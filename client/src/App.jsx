import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import NewProject from './pages/NewProject';
import ProjectView from './pages/ProjectView';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewProject />} />
        <Route path="/project/:id" element={<ProjectView />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
