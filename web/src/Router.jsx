import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import Home from './pages/Home';
import LoggedIn from './pages/LoggedIn';
import { AuthenticationGuard } from './components/auth/AuthenticationGuard';
import { CollapseDesktop } from './pages/CollapseDesktop';
import { HomePage } from './pages/HomePage'
import { Loader, Center } from '@mantine/core';

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
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route
        path="/protected"
        element={<AuthenticationGuard element={<CollapseDesktop/>} />}
      />
    </Routes>
  );
};

export default Router;