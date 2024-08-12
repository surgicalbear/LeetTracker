/*
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
*/
import React from 'react';
import { UnstyledButton, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import classes from './ActionToggle.module.css';
import styleClasses from '../pages/styles/HomePage.module.css';

export function ColorSchemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <UnstyledButton
      onClick={() => toggleColorScheme()}
      className={styleClasses.control}
    >
      {colorScheme === 'dark' ? (
        <IconSun className={classes.icon} stroke={1.5} />
      ) : (
        <IconMoon className={classes.icon} stroke={1.5} />
      )}
    </UnstyledButton>
  );
}