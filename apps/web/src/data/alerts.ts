export type StaffRole = "viewer" | "officer" | "approver";
export interface ServerAlert {
  id: string;
  status: "draft" | "approved" | "sent" | "cancelled";
  revision: number;
  snapshot_id: string;
  ward_ids: string[];
  risk_level: number;
  audience: string;
  languages: string[];
  created_by: string;
  approved_by: string | null;
  expires_at: string;
  created_at: string;
  cap_status: "Test" | "Exercise";
  is_simulation: boolean;
  content_sha256: string;
  content: {
    text: string;
    instructions: string;
    method_version: string;
    snapshot_issued_at: string;
    draft_request: DraftInput;
  };
  delivery_summary?: Record<string, number>;
}
export interface DraftInput {
  snapshot_id: string;
  ward_ids: string[];
  risk_level: number;
  audience: string;
  languages: string[];
  action_ids: string[];
  onset: string;
  expires: string;
}
export interface ActionTemplate {
  id: string;
  active: boolean;
  audience: string;
  levels: number[];
  text_en: string;
  source_section: string;
  requires_confirmation: boolean;
}
