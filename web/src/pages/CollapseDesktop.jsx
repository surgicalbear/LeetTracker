import { AppShell, Burger, Group, Skeleton, Box, Button, UnstyledButton, ThemeIcon} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { MantineLogo } from '@mantinex/mantine-logo';
import { ColorSchemeToggle } from '../ColorSchemeTheme/ColorSchemeToggle';
import React from 'react';
import { withAuth0 } from "@auth0/auth0-react"; 
import classes from './styles/HomePage.module.css'
import { IconLogout2, IconList, IconFolderPlus, IconTrendingUp3 } from '@tabler/icons-react';


export const CollapseDesktop = withAuth0(({ auth0 }) => {
  const { getAccessTokenSilently, isLoading, user, logout, isAuthenticated } = auth0; 
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" position="apart">
            <Group style={{flex: 1}} spacing="md" >
              <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
              <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
              <MantineLogo size={30} />
            </Group>
            <ColorSchemeToggle />
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
      {isAuthenticated && (
          <UnstyledButton
            className={classes.control}
            onClick={() => logout({})}
            mt="sm"
          >
            <Group>
              <ThemeIcon color="blue" variant="light">
                <IconLogout2 size="1rem" />
              </ThemeIcon>
              Logout
            </Group>
          </UnstyledButton>
        )}
        <UnstyledButton
            className={classes.control}
            onClick={() => logout({})}
            mt="sm"
          >
            <Group>
              <ThemeIcon color="cyan" variant="light">
                <IconList size="1rem" />
              </ThemeIcon>
              My practice sets
            </Group>
          </UnstyledButton>
          <UnstyledButton
            className={classes.control}
            onClick={() => logout({})}
            mt="sm"
          >
            <Group>
              <ThemeIcon color="violet" variant="light">
                <IconFolderPlus size="1rem" />
              </ThemeIcon>
              Create practice set
            </Group>
          </UnstyledButton>
          <UnstyledButton
            className={classes.control}
            onClick={() => logout({})}
            mt="sm"
          >
            <Group>
              <ThemeIcon color="grape" variant="light">
                <IconTrendingUp3 size="1rem" />
              </ThemeIcon>
              Progress
            </Group>
          </UnstyledButton>
      
    </AppShell.Navbar>
      <AppShell.Main>Main</AppShell.Main>
    </AppShell>
  );
})