import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import '@mantine/core/styles.css';
import 'mantine-react-table/styles.css';
import {
  flexRender,
  MRT_TablePagination,
  MRT_ToolbarAlertBanner,
  useMantineReactTable,
  MRT_TableBodyCellValue,
} from 'mantine-react-table';
import { Flex, Stack, Table, Title, Checkbox, Anchor, Loader, Text, Badge, Menu, ActionIcon, UnstyledButton, Group, ThemeIcon, Center, Button } from '@mantine/core';
import { IconDots, IconTrash, IconSquarePlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

const SetProblems = () => {
  const { setId } = useParams();
  const { getAccessTokenSilently } = useAuth0();
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();


  const fetchProblems = async () => {
    setIsLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`http://localhost:8080/lists/${setId}/items`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch problems');
      }
      const data = await response.json();
      //setProblems(data);
      setProblems(data || []);
    } catch (error) {
      console.error('Error fetching problems:', error);
      setError('Failed to fetch problems. Please try again later.');
      setProblems([]); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [setId, getAccessTokenSilently]);

  const handleCompletionToggle = async (listItemId, completed) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`http://localhost:8080/list-items/${listItemId}/completion`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !completed }),
      });
      if (!response.ok) {
        throw new Error('Failed to update completion status');
      }
      setProblems(prevProblems =>
        prevProblems.map(problem =>
          problem.id === listItemId
            ? { ...problem, completed: !completed }
            : problem
        )
      );
    } catch (error) {
      console.error('Error updating completion status:', error);
    }
  };

  const handleDeleteProblem = async (problemId) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`http://localhost:8080/lists/remove-problem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ list_id: parseInt(setId, 10), problem_id: parseInt(problemId, 10) }),
      });
      if (!response.ok) {
        throw new Error('Failed to delete problem');
      }
      fetchProblems();
    } catch (error) {
      console.error('Error deleting problem:', error);
      setError('Failed to delete problem. Please try again later.');
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'completed',
        header: 'Status',
        Cell: ({ row }) => (
          <Checkbox color="green" variant="outline"
            checked={row.original.completed}
            onChange={() => handleCompletionToggle(row.original.id, row.original.completed)}
          />
        ),
      },
      {
        accessorKey: 'problem_id',
        header: 'Problem ID',
      },
      {
        accessorKey: 'problem_title',
        header: 'Title',
      },
      {
        accessorKey: 'problem_difficulty',
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
        accessorKey: 'acceptance_rate', 
        header: 'Acceptance Rate',
        Cell: ({ cell }) => `${(cell.getValue()).toFixed(1)}%`,
      },
      {
        accessorKey: 'url',
        header: 'LeetCode Link',
        Cell: ({ row }) => (
          <Anchor 
            href={row.original.url || getLeetCodeUrl(row.original.problem_title)} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            View Problem
          </Anchor>
        ),
      },
      {
        accessorKey: 'actions',
        header: 'Actions',
        Cell: ({ row }) => (
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant= "light" color="gray">
                <IconDots size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item 
                color="red" 
                icon={<IconTrash size={14} />}
                onClick={() => handleDeleteProblem(row.original.problem_id)}
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        ),
      },
    ],
    []
  );

  const table = useMantineReactTable({
    columns,
    data: problems,
    enableRowSelection: false,
    enableColumnFilters: false,
    mantineSearchTextInputProps: {
      variant: 'filled',
    },
    initialState: {
      pagination: { pageSize: 25, pageIndex: 0 },
    },
    mantinePaginationProps: {
      rowsPerPageOptions: ['10', '25', '50', '100'],
    },
    paginationDisplayMode: 'pages',
  });

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <Text c="red">{error}</Text>;
  }

  return (
    <Stack>
      <Title order={1} align="center" mb="xl" >Problems in set</Title>
      {problems.length > 0 ? (
        <>
          <Flex justify="space-between" align="center">
            <Button
              onClick={() => navigate(`/sets`)}
              variant="subtle"
              color="blue"
              mr="md"
            >
              Back to Sets
            </Button>
          <UnstyledButton
            onClick={() => navigate(`/sets/${setId}/add-problems`)}
            mt="sm"
          >
          <Group>
            Add problems
            <ThemeIcon color="green" variant="light">
              <IconSquarePlus size="1rem" />
            </ThemeIcon>
          </Group>
          </UnstyledButton>
          </Flex>
          <Table
            captionSide="top"
            fz="md"
            highlightOnHover
            horizontalSpacing="xl"
            verticalSpacing="xs"
            withTableBorder
            withColumnBorders
            m="0"
          >
            <Table.Thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <Table.Tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <Table.Th key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.Header ??
                              header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </Table.Th>
                  ))}
                </Table.Tr>
              ))}
            </Table.Thead>
            <Table.Tbody>
              {table.getRowModel().rows.map((row) => (
                <Table.Tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Table.Td key={cell.id}>
                      <MRT_TableBodyCellValue cell={cell} table={table} />
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Flex justify="space-between" align="center">
            <MRT_TablePagination table={table} />
            <MRT_ToolbarAlertBanner stackAlertBanner table={table} />
          </Flex>
        </>
      ) : (
        <Center style={{ flexDirection: 'column' }}>
          <Text align="center" mb="md">Hey, you don't have any problems in this set yet.</Text>
          <Button
            onClick={() => navigate(`/sets/${setId}/add-problems`)}
            variant="subtle"
            color="blue"
          >
            Add problems
          </Button>
        </Center>
      )}
    </Stack>
  );
};

export default SetProblems;