export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  company_id: number;
}

export interface AuthResponse {
  message: string;
  access_token: string;
  refresh_token?: string;
  user: User;
}

export interface Workspace {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface Project {
  id: number;
  workspace_id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

export interface TeamMember {
  id: number;
  full_name?: string;
  name?: string;
  email: string;
  role?: string;
  is_active?: boolean;
}

export interface Task {
  id: number;
  company_id?: number;
  project_id?: number;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigned_to?: number | null;
  assignee?: {
    id: number;
    name: string;
    email: string;
  } | null;
  created_by?: number;
  due_date?: string | null;
  order_index?: number;
  created_at?: string;
}