import { AppShell, Burger, Group, Button, Space, Center, UnstyledButton, ThemeIcon, Title, Text} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { MantineLogo } from '@mantinex/mantine-logo';
import classes from './styles/HomePage.module.css';
import classes2 from './styles/NotFoundTitle.module.css'
import { useAuth0 } from "@auth0/auth0-react";
import { ColorSchemeToggle } from '../ColorSchemeTheme/ColorSchemeToggle';
import { IconLogin2 } from '@tabler/icons-react';

export function HomePage() {
  const [opened, { toggle }] = useDisclosure();
  const { isAuthenticated, loginWithRedirect } = useAuth0();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { desktop: true, mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Group justify="space-between" style={{ flex: 1 }}>
            <MantineLogo size={30} />
            <Group ml="xl" gap={10}>
              <ColorSchemeToggle/>
            </Group>
          </Group>
        </Group>
      </AppShell.Header>
        <AppShell.Navbar py="md" px={4}>
          
          {!isAuthenticated && (
          <UnstyledButton
            className={classes.control}
            onClick={() => loginWithRedirect({})}
            mt="sm"
          >
            <Group>
              <ThemeIcon color="blue" variant="light">
                <IconLogin2 size="1rem" />
              </ThemeIcon>
              Get Started
            </Group>
          </UnstyledButton>
          
        )}
      </AppShell.Navbar>

      <AppShell.Main>
          <Space h="xl" />
          <Title className={classes2.title}>Welcome to LeetTracker</Title>
          <Space h="xl"/>
          <Text c="dimmed" size="xl" ta="center" className={classes.description}>
            Create and share LeetCode problem sets all while tracking your progress.
          </Text>
          <Space h="xl"/>
          <Center>
            {!isAuthenticated && <Button variant="subtle" size="l" onClick={() => loginWithRedirect({})}>Get Started</Button>}
          </Center>
      </AppShell.Main>
    </AppShell>
  );
}