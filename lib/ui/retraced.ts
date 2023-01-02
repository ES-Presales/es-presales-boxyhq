import axios from 'axios';
import useSWR from 'swr';

import type { ApiError, ApiSuccess } from 'types';
import type { Project, Group } from 'types/retraced';
import { fetcher } from '@lib/ui/utils';

export const useProject = (projectId: string) => {
  const { data, error } = useSWR<ApiSuccess<{ project: Project }>, ApiError>(
    `/api/admin/retraced/projects/${projectId}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    project: data?.data.project,
    isLoading: !error && !data,
    isError: error,
  };
};

export const useProjects = () => {
  const { data, error } = useSWR<ApiSuccess<{ projects: Project[] }>, ApiError>(
    '/api/admin/retraced/projects',
    fetcher
  );

  return {
    projects: data?.data?.projects,
    isLoading: !error && !data,
    isError: error,
  };
};

export const useGroups = (projectId: string, environmentId: string) => {
  const { data, error } = useSWR<ApiSuccess<{ groups: Group[] }>, ApiError>(
    environmentId ? `/api/admin/retraced/projects/${projectId}/groups?environmentId=${environmentId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    groups: data?.data?.groups,
    isLoading: !error && !data,
    isError: error,
  };
};
