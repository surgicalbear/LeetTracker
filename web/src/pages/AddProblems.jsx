import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import '@mantine/core/styles.css';
import 'mantine-react-table/styles.css';
import {
  MantineReactTable,
  useMantineReactTable,
} from 'mantine-react-table';
import { Flex, Stack, Title, Checkbox, Anchor, Loader, Text, Badge, Button, Center } from '@mantine/core';

const AddProblems = () => {
  const { setId } = useParams();
  const { getAccessTokenSilently } = useAuth0();
  const [problems, setProblems] = useState([]);
  const [selectedProblems, setSelectedProblems] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchAllProblems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAccessTokenSilently();
      let allProblems = [];
      let page = 1;
      const pageSize = 1000; 
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(`http://localhost:8080/leetcode-problems?page=${page}&pageSize=${pageSize}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch problems');
        }
        const data = await response.json();
        
        if (Array.isArray(data.problems) && data.problems.length > 0) {
          allProblems = [...allProblems, ...data.problems];
          page++;
        } else {
          hasMore = false;
        }
      }

      setProblems(allProblems);
      const initialSelected = {};
      allProblems.forEach(problem => {
        initialSelected[problem.frontendQuestionId] = false;
      });
      setSelectedProblems(initialSelected);
    } catch (error) {
      console.error('Error fetching problems:', error);
      setError('Failed to fetch problems. Please try again later.');
      setProblems([]);
      setSelectedProblems({});
    } finally {
      setIsLoading(false);
    }
  }, [getAccessTokenSilently]);

  useEffect(() => {
    fetchAllProblems();
  }, [fetchAllProblems]);

  const handleAddProblems = async () => {
    try {
      const token = await getAccessTokenSilently();
      const listId = parseInt(setId, 10);
      const problemsToAdd = Object.entries(selectedProblems)
        .filter(([_, isSelected]) => isSelected)
        .map(([problemId, _]) => parseInt(problemId, 10));

      if (problemsToAdd.length === 0) {
        setError("Please select at least one problem to add.");
        return;
      }

      const response = await fetch(`http://localhost:8080/lists/add-problem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ list_id: listId, problem_ids: problemsToAdd }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add problems to list: ${errorText}`);
      } else {
        navigate(`/sets/${setId}/problems`);
      }
    } catch (error) {
      setError(`Failed to add problems to list: ${error.message}`);
    }
  };

  const handleCheckboxChange = (problemId) => {
    setSelectedProblems(prev => ({
      ...prev,
      [problemId]: !prev[problemId]
    }));
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'selected',
        header: 'Add',
        Cell: ({ row }) => (
          <Checkbox
            color="green"
            variant="outline"
            checked={selectedProblems[row.original.frontendQuestionId] || false}
            onChange={() => handleCheckboxChange(row.original.frontendQuestionId)}
          />
        ),
        enableColumnFilter: false,
        enableGlobalFilter: false,
      },
      {
        accessorKey: 'frontendQuestionId',
        header: 'Problem ID',
      },
      {
        accessorKey: 'title',
        header: 'Title',
      },
      {
        accessorKey: 'difficulty',
        header: 'Difficulty',
        Cell: ({ cell }) => {
          const difficulty = cell.getValue();
          let color;
          switch(difficulty.toLowerCase()) {
            case 'easy': color = 'green'; break;
            case 'medium': color = 'yellow'; break;
            case 'hard': color = 'red'; break;
            default: color = 'gray';
          }
          return <Badge variant="light" color={color}>{difficulty}</Badge>;
        },
      },
      {
        accessorKey: 'acRate',
        header: 'Acceptance Rate',
        Cell: ({ cell }) => `${(cell.getValue()).toFixed(1)}%`,
      },
      {
        accessorKey: 'url',
        header: 'LeetCode Link',
        Cell: ({ row }) => (
          <Anchor 
            href={row.original.url} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            View Problem
          </Anchor>
        ),
        enableColumnFilter: false,
        enableGlobalFilter: false,
      },
    ],
    [selectedProblems]
  );

  const table = useMantineReactTable({
    columns,
    data: problems,
    enableRowSelection: false,
    enableColumnFilters: true,
    enableGlobalFilter: true,
    enablePagination: true,
    manualFiltering: false,
    manualPagination: false,
    initialState: {
      showGlobalFilter: true,
      pagination: { pageIndex: 0, pageSize: 25 },
    },
    mantinePaginationProps: {
      rowsPerPageOptions: ['10', '25', '50', '100'],
    },
    paginationDisplayMode: 'pages',
    mantineSearchTextInputProps: {
      placeholder: 'Search problems...',
      variant: 'filled',
      sx: { maxWidth: '300px' },
    },
    positionGlobalFilter: 'left',
    mantineTableBodyCellProps: {
      sx: {
        '&:hover': {
          backgroundColor: 'transparent !important',
        },
      },
    },
    mantineTableBodyRowProps: {
      sx: {
        '&:hover td': {
          backgroundColor: 'transparent !important',
        },
      },
    },
  });

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Stack>
      <Title order={1} align="center" mb="xl">Add Problems to Set</Title>
      <Flex justify="flex-end" mb="md">
        <Button
          onClick={() => navigate(`/sets/${setId}/problems`)}
          variant="subtle"
          color="blue"
          mr="md"
        >
          Back to Set
        </Button>
        <Button
          onClick={handleAddProblems}
          variant="subtle"
          color="green"
        >
          Add Selected Problems
        </Button>
      </Flex>
      {error && (
        <Center>
          <Text c="red">{error}</Text>
        </Center>
      )}
      <MantineReactTable table={table} />
    </Stack>
  );
}

export default AddProblems;