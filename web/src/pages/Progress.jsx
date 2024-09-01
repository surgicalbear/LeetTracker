import React, { useState, useEffect } from 'react';
import { TextInput, Button, Paper, Title, Text, Group, Stack, Grid, Loader } from '@mantine/core';
import { LineChart, Line, PieChart, Pie, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, Legend, CartesianGrid } from 'recharts';

const BACKEND_API_ENDPOINT = 'http://localhost:8080/leetcode-stats';
const HISTORY_API_ENDPOINT = 'http://localhost:8080/user-progress-history';
const STORAGE_KEY = 'leetcode_username';
const COLORS = ['#8ce99a', '#ffe066', '#ffa8a8'];

const Progress = () => {
  const [username, setUsername] = useState('');
  const [savedUsername, setSavedUsername] = useState('');
  const [stats, setStats] = useState(null);
  const [progressHistory, setProgressHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUsername = localStorage.getItem(STORAGE_KEY);
    if (storedUsername) {
      setSavedUsername(storedUsername);
      setUsername(storedUsername);
      fetchLeetCodeStats(storedUsername);
    }
  }, []);

  const fetchLeetCodeStats = async (usernameToFetch) => {
    if (!usernameToFetch) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const query = `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
            submitStats: submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
                submissions
              }
            }
            profile {
              ranking
            }
          }
        }
      `;

      const response = await fetch(BACKEND_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { username: usernameToFetch },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      if (!data.data || !data.data.matchedUser) {
        throw new Error('User not found or invalid response structure');
      }

      const userData = data.data.matchedUser;
      const submitStats = userData.submitStats.acSubmissionNum;

      setStats({
        totalSolved: submitStats.find(stat => stat.difficulty === 'All').count,
        easySolved: submitStats.find(stat => stat.difficulty === 'Easy').count,
        mediumSolved: submitStats.find(stat => stat.difficulty === 'Medium').count,
        hardSolved: submitStats.find(stat => stat.difficulty === 'Hard').count,
        acceptanceRate: ((submitStats.find(stat => stat.difficulty === 'All').count / submitStats.find(stat => stat.difficulty === 'All').submissions) * 100).toFixed(2),
        ranking: userData.profile.ranking,
      });

      const historyResponse = await fetch(`${HISTORY_API_ENDPOINT}?username=${usernameToFetch}`);
      if (!historyResponse.ok) {
        throw new Error(`HTTP error! status: ${historyResponse.status}`);
      }
      const historyData = await historyResponse.json();
      setProgressHistory(historyData || []);

    } catch (error) {
      console.error('Error fetching LeetCode stats:', error);
      setError(`Failed to fetch LeetCode stats: ${error.message}`);
      setProgressHistory([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUsername = () => {
    if (username) {
      localStorage.setItem(STORAGE_KEY, username);
      setSavedUsername(username);
      fetchLeetCodeStats(username);
    }
  };

  const handleChangeUsername = () => {
    setSavedUsername('');
    localStorage.removeItem(STORAGE_KEY);
    setStats(null);
    setProgressHistory([]);
  };

  const difficultyData = stats ? [
    { name: 'Easy', value: stats.easySolved },
    { name: 'Medium', value: stats.mediumSolved },
    { name: 'Hard', value: stats.hardSolved },
  ] : [];

  return (
    <Stack spacing="xl">
      <Title order={1} align="center">LeetCode Progress</Title>
      
      <Paper shadow="xs" p="md">
        {!savedUsername ? (
          <Group>
            <TextInput
              placeholder="Enter LeetCode username"
              value={username}
              onChange={(event) => setUsername(event.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Button onClick={handleSaveUsername} disabled={loading || !username}>
              Save
            </Button>
          </Group>
        ) : (
          <Group position="apart">
            <Text>Tracking progress for: <strong>{savedUsername}</strong></Text>
            <Button onClick={handleChangeUsername} variant="subtle">
              Change Username
            </Button>
          </Group>
        )}
      </Paper>

      {error && <Text c="red">{error}</Text>}

      {loading && <Loader />}

      {stats && (
        <Stack spacing="xl">
          <Paper shadow="xs" p="md">
            <Grid gutter="md">
              <Grid.Col span={3}>
                <Paper shadow="xs" p="sm" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <Title order={3}>Total Solved</Title>
                  <Text size="xl" style={{ marginTop: '10px' }}>{stats.totalSolved}</Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={3}>
                <Paper shadow="xs" p="sm" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <Title order={3}>Acceptance Rate</Title>
                  <Text size="xl" style={{ marginTop: '10px' }}>{stats.acceptanceRate}%</Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={3}>
                <Paper shadow="xs" p="sm" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <Title order={3}>Ranking</Title>
                  <Text size="xl" style={{ marginTop: '10px' }}>{stats.ranking}</Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={3}>
                <Paper shadow="xs" p="sm" style={{ height: '100%' }}>
                  <Title order={3} align="center" mb="sm">Difficulty Distribution</Title>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie
                        data={difficultyData}
                        cx="50%"
                        cy="50%"
                        outerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {difficultyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid.Col>
            </Grid>
          </Paper>

          {progressHistory && progressHistory.length > 0 && (
            <Paper shadow="xs" p="md">
              <Title order={3} mb="md">Problem Solving Progress</Title>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progressHistory}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="totalSolved" stroke="#8884d8" name="Total Solved" />
                  <Line type="monotone" dataKey="easySolved" stroke="#8ce99a" name="Easy" />
                  <Line type="monotone" dataKey="mediumSolved" stroke="#f9db63" name="Medium" />
                  <Line type="monotone" dataKey="hardSolved" stroke="#ed9c9c" name="Hard" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          )}
        </Stack>
      )}
    </Stack>
  );
};


export default Progress;
