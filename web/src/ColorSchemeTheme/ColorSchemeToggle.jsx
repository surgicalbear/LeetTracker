/*import { Button, Group, useMantineColorScheme } from '@mantine/core';
import React from 'react'

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();

  return (
    <Group justify="center" mt="xl">
      <Button onClick={() => setColorScheme('light')}>Light</Button>
      <Button onClick={() => setColorScheme('dark')}>Dark</Button>
    </Group>
  );
}
*/
/*
import { ActionIcon, useMantineColorScheme, useComputedColorScheme, Group } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import cx from 'clsx';
import classes from './ActionToggle.module.css';
import styleClasses from '../pages/styles/HomePage.module.css'
import React from 'react';

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  return (
    <Group justify="center">
      <ActionIcon
        onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
        variant="default"
        size="xl"
        aria-label="Toggle color scheme"
        //className={styleClasses.control}
      >
        <IconSun className={cx(classes.icon, classes.light)} stroke={1.5} />
        <IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5} />
      </ActionIcon>
    </Group>
  );
}*/
import { Button, UnstyledButton, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import cx from 'clsx';
import classes from './ActionToggle.module.css';
import styleClasses from '../pages/styles/HomePage.module.css';
import React from 'react';

export function ColorSchemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <UnstyledButton
      onClick={() => toggleColorScheme()}
      variant={colorScheme === 'dark' ? 'light' : 'dark'}
      className={styleClasses.control}
    >
      <IconSun className={cx(classes.icon, classes.light, { [classes.hidden]: colorScheme === 'dark' })} stroke={1.5} />
      <IconMoon className={cx(classes.icon, classes.dark, { [classes.hidden]: colorScheme === 'light' })} stroke={1.5} />
    </UnstyledButton>
  );
}