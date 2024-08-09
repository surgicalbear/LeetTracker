import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { ColorSchemeToggle } from "./ColorSchemeTheme/ColorSchemeToggle";
import React from "react";
import Router from "./Router"

export default function App() {
  return (
    <MantineProvider theme='dark'>
      <Router />
    </MantineProvider>
  );
}