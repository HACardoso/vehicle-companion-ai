export interface Vehicle {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  license_plate: string | null;
  current_mileage: number;
  created_at: string;
  updated_at: string;
}

export interface VehicleDocument {
  id: string;
  vehicle_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  status: 'processing' | 'ready' | 'insufficient_quality';
  extracted_text_length: number;
  illegible_rate: number;
  quality_notes: string[] | null;
  uploaded_at: string;
}

export interface ConsultationHistory {
  id: string;
  user_id: string;
  vehicle_id: string;
  document_id: string | null;
  consultation_type: 'obd' | 'diagnosis' | 'maintenance';
  input_data: Record<string, unknown>;
  response_data: AIResponse;
  pdf_references: PdfReference[] | null;
  has_safety_alert: boolean;
  created_at: string;
}

export interface PdfReference {
  page: number;
  excerpt?: string;
}

export interface AIResponse {
  sections: ResponseSection[];
  safety_alert?: SafetyAlert;
  base_used?: BaseUsed;
  disclaimer?: string;
}

export interface ResponseSection {
  title: string;
  content: string | string[];
  type: 'text' | 'list' | 'checklist';
}

export interface SafetyAlert {
  message: string;
  severity: 'warning' | 'critical';
}

export interface BaseUsed {
  source: 'pdf' | 'general';
  file_name?: string;
  references?: PdfReference[];
  no_relevant_excerpt?: boolean;
}

export interface OBDInput {
  code: string;
}

export interface DiagnosisInput {
  symptoms: string;
}

export interface MaintenanceInput {
  current_mileage: number;
  last_service_date: string;
}
