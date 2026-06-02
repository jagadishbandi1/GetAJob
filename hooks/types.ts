export interface Rule {
  id: number;
  trigger_keyword: string;
  response: string;
}

export interface Application {
  id: number;
  job_url: string;
  company: string;
  job_title: string;
  location: string;
  compensation: string;
  status: string;
  log: string;
  applied_at: string;
  source?: string;
}

export interface TrainingExample {
  id: number;
  question_text: string;
  answer_given: string;
  job_url: string;
  created_at: string;
}

export interface Document {
  id: number;
  name: string;
  file_type: string;
  preview: string;
  created_at: string;
}

export interface Profile {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  resume_text: string;
  free_context: string;
  resume_file_name: string;
  gmail_token?: string;
}

export interface Health {
  ai: boolean;
  database: boolean;
  playwright: boolean;
  gmail: boolean;
}

export const defaultProfile: Profile = {
  full_name: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  website: "",
  resume_text: "",
  free_context: "",
  resume_file_name: "",
};

export type Section = "home" | "knowledge" | "tracker" | "training";

