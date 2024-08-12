import React, { useEffect, useMemo, useState } from 'react';
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table';
import { withAuth0 } from "@auth0/auth0-react";

const LeetCodeProblemsTable = ({ setId, auth0 }) => {
  const { getAccessTokenSilently } = auth0;
  const [data, setData] = useState([]);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!data.length) {
        setIsLoading(true);
      } else {
        setIsRefetching(true);
      }

      try {
        const token = await getAccessTokenSilently();
        const url = new URL('http://localhost:8080/leetcode-problems');
        url.searchParams.set('page', `${pagination.pageIndex + 1}`);
        url.searchParams.set('pageSize', `${pagination.pageSize}`);
        url.searchParams.set('filters', JSON.stringify(columnFilters));
        url.searchParams.set('globalFilter', globalFilter);
        url.searchParams.set('sorting', JSON.stringify(sorting));
        url.searchParams.set('setId', setId);

        const response = await fetch(url.href, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await response.json();
        console.log('Received data:', json);
        setData(json.problems || []);
        setRowCount(json.totalCount || 0);
      } catch (error) {
        setIsError(true);
        console.error('Fetch error:', error);
      }

      setIsError(false);
      setIsLoading(false);
      setIsRefetching(false);
    };

    fetchData();
  }, [
    columnFilters,
    globalFilter,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    setId,
    getAccessTokenSilently,
  ]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'frontendQuestionId',
        header: 'ID',
        Cell: ({ cell }) => cell.getValue() ?? 'N/A',
      },
      {
        accessorKey: 'title',
        header: 'Title',
        Cell: ({ cell }) => cell.getValue() ?? 'N/A',
      },
      {
        accessorKey: 'difficulty',
        header: 'Difficulty',
        Cell: ({ cell }) => cell.getValue() ?? 'N/A',
      },
      {
        accessorKey: 'acRate',
        header: 'Acceptance Rate',
        Cell: ({ cell }) => {
          const value = cell.getValue();
          return value !== undefined && value !== null
            ? `${value.toFixed(2)}%`
            : 'N/A';
        },
      },
      {
        accessorKey: 'paidOnly',
        header: 'Premium',
        Cell: ({ cell }) => (cell.getValue() ? 'Yes' : 'No'),
      },
      {
        accessorKey: 'url',
        header: 'URL',
        Cell: ({ cell }) => {
          const value = cell.getValue();
          return value ? (
            <a href={value} target="_blank" rel="noopener noreferrer">
              Link
            </a>
          ) : 'N/A';
        },
      },
    ],
    []
  );

  const table = useMantineReactTable({
    columns,
    data,
    enableRowSelection: true,
    getRowId: (row) => row.frontendQuestionId,
    initialState: { showColumnFilters: true },
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    rowCount,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      globalFilter,
      isLoading,
      pagination,
      showAlertBanner: isError,
      showProgressBars: isRefetching,
      sorting,
    },
    mantineToolbarAlertBannerProps: isError
      ? { color: 'red', children: 'Error loading data' }
      : undefined,
  });

  return <MantineReactTable table={table} />;
};

export default withAuth0(LeetCodeProblemsTable)
