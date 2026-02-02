-- Tabela de veículos do usuário
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  year INTEGER,
  license_plate TEXT,
  current_mileage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de documentos PDF
CREATE TABLE public.vehicle_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'insufficient_quality')),
  extracted_text_length INTEGER DEFAULT 0,
  illegible_rate REAL DEFAULT 0,
  quality_notes TEXT[],
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de consultas
CREATE TABLE public.consultation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.vehicle_documents(id) ON DELETE SET NULL,
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('obd', 'diagnosis', 'maintenance')),
  input_data JSONB NOT NULL,
  response_data JSONB NOT NULL,
  pdf_references JSONB,
  has_safety_alert BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for vehicles
CREATE POLICY "Users can view their own vehicles" 
ON public.vehicles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vehicles" 
ON public.vehicles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicles" 
ON public.vehicles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicles" 
ON public.vehicles FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for vehicle_documents
CREATE POLICY "Users can view their own documents" 
ON public.vehicle_documents FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents" 
ON public.vehicle_documents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.vehicle_documents FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.vehicle_documents FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for consultation_history
CREATE POLICY "Users can view their own consultations" 
ON public.consultation_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consultations" 
ON public.consultation_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for vehicles
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('vehicle-documents', 'vehicle-documents', false, 20971520);

-- Storage policies
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vehicle-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'vehicle-documents' AND auth.uid()::text = (storage.foldername(name))[1]);