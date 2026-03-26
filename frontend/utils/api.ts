import axios from 'axios'
import { ApiResponse, SkillUpgradeResponse } from '@/types'

const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:8000',
  timeout: 180000, // 3 min for LangGraph + validation retry
})

export async function analyzeCareer(
  message: string,
  resumeFile?: File,
  careerGoal?: string,
  preferences?: Record<string, unknown>
): Promise<ApiResponse> {
  const form = new FormData()
  form.append('message', message)

  if (careerGoal)   form.append('career_goal', careerGoal)
  if (preferences)  form.append('preferences', JSON.stringify(preferences))
  if (resumeFile)   form.append('resume_file', resumeFile)

  const { data } = await api.post<ApiResponse>('/analyze', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function sendChat(
  message: string
): Promise<{ user_id: string; message: string }> {
  const form = new FormData()
  form.append('message', message)

  const { data } = await api.post('/chat', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function requestSkillUpgrade(
  selectedCareer: string
): Promise<SkillUpgradeResponse> {
  const form = new FormData()
  form.append('selected_career', selectedCareer)

  const { data } = await api.post<SkillUpgradeResponse>('/skill-upgrade', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function getHealth(): Promise<{
  status: string
  storage: string
  tavily_cache_entries: number
}> {
  const { data } = await api.get('/health')
  return data
}
