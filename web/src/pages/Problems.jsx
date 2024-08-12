import React from 'react';
import { withAuth0 } from "@auth0/auth0-react";
import { Container, Title, Space } from '@mantine/core';
import { useParams } from 'react-router-dom';
import  LeetCodeProblemsTable from '../components/tables/LeetCodeProblemsTable';

const Problems = ({ auth0 }) => {
  const { setId } = useParams();
  const auth0 = useAuth0();

  return (
    <Container size="xl">
      <Title order={1} align="center">LeetCode Problems</Title>
      <Space h="md" />
      <LeetCodeProblemsTable setId={setId} auth0={auth0} />
    </Container>
  );
};

export default withAuth0(Problems);

