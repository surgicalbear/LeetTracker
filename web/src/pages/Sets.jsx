import React, { useState, useEffect } from 'react';
import { withAuth0 } from "@auth0/auth0-react";
import { Text, Button, Container, Title, Card, Badge, ActionIcon, Flex, Center, Modal } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

const getDifficultyColor = (difficulty) => {
  switch(difficulty.toLowerCase()) {
    case 'easy': return 'green';
    case 'medium': return 'yellow';
    case 'hard': return 'red';
    default: return 'gray';
  }
};

const Sets = ({ auth0 }) => {
  const [sets, setSets] = useState([]);
  const { getAccessTokenSilently } = auth0;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [selectedSet, setSelectedSet] = useState(null);

  const fetchSets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch('http://localhost:8080/getlists', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch sets');
      }
      const data = await response.json();
      setSets(data);
      setSets(data || []);
    } catch (error) {
      console.error('Error fetching sets:', error);
      setError('Failed to fetch sets. Please try again later.');
    } finally {
      setIsLoading(true)
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`http://localhost:8080/lists/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete set');
      }
      fetchSets();
    } catch (error) {
      console.error('Error deleting set:', error);
    }
  };
  const handleViewSet = (setId) => {
    navigate(`/sets/${setId}/problems`);
  };

  useEffect(() => {
    fetchSets();
  }, [getAccessTokenSilently]);

  return (
    <Container size="xl">
      <Title order={1} align="center" mb="xl" >Your Practice Sets</Title>
      {sets.length === 0 ? (
        <Center style={{ flexDirection: 'column' }}>
          <Text align="center" mb="md">Hey, you don't have any practice sets yet.</Text>
          <Button
            onClick={() => navigate('/create')}
            variant="subtle"
            color="blue"
          >
            Create Set
          </Button>
        </Center>
      ) : (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(34ch, 1fr))',
          gridGap: '20px',
        }}
      >
        {sets.map((set) => (
          <Card 
            key={set.id}
            shadow="sm" 
            padding="lg" 
            radius="md" 
            withBorder
            sx={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            {/* Badge Container */}
            <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
              <Badge color={getDifficultyColor(set.difficulty)} variant="light">
                {set.difficulty}
              </Badge>
            </div>
            <div style={{ position: 'absolute', top:'10px', left: '10px'}}>
              <ActionIcon color="red" variant="light" onClick={() => handleDelete(set.id)}>
                <IconTrash size="1rem" />
              </ActionIcon>
            </div>
            <Card.Section>
              <Title order={4} align="center" mt="md">
                {set.name}
              </Title>
            </Card.Section>
            <Flex direction="column" style={{ flex: 1 }}>
              <Text size="sm" c="dimmed" mt="md" style={{ flex: 1 }}>
                  {set.description}
              </Text> 
              <Button variant="default" color="blue" fullWidth mt="md" radius="md" onClick={() => handleViewSet(set.id)}>
                View Set
              </Button>
            </Flex>
          </Card>
        ))}
      </div>
      )}
       <Modal
        opened={selectedSet !== null}
        onClose={() => setSelectedSet(null)}
        title={selectedSet ? `Problems in ${selectedSet.name}` : ''}
        size="xl"
      >
        {selectedSet && (
          <LeetCodeProblemsTable setId={selectedSet.id} auth0={auth0} />
        )}
      </Modal>
    </Container>
  );
};

export default withAuth0(Sets);
