import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { AuthenticationGuard } from './components/auth/AuthenticationGuard';
import { LoggedIn } from './pages/LoggedIn';
import { HomePage } from './pages/HomePage'
import { Loader, Center } from '@mantine/core';
import { NotFound404 } from './pages/NotFound404'
import CreateSet from './pages/CreateSet'
import Sets from './pages/Sets'
import Problems from './components/tables/LeetCodeProblemsTable'
import SetProblems from './pages/SetProblems'

const Router = () => {
  const { isLoading } = useAuth0();

  if (isLoading) {
    return (
      <Center>
        <Loader color="blue"/>
      </Center>
    );
  }

  return (
    <Routes>
      <Route exact path="/" element={<HomePage />} />
      <Route exact path="/home" element={<HomePage />} />
      <Route element={<AuthenticationGuard element={<LoggedIn />} />}>
        <Route exact path="/protected" element={<NotFound404 />} />
        <Route exact path="/sets" element={<Sets />} />
        <Route exact path="/create" element={<CreateSet />} />
        <Route path="/sets/:setId/problems" element={<SetProblems />} />
        <Route exact path="/progress" element={<NotFound404 />} />
      </Route>
      <Route path="*" element={<NotFound404 />} />
    </Routes>
  );
};

export default Router;