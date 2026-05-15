import type { Stop } from '@/types/api'
import { apiFetch } from './api'

export async function getStopsAll(): Promise<Stop[]> {
  return apiFetch<Stop[]>('/stops/all')
}