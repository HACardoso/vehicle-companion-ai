export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  references?: PdfReference[];
  isLoading?: boolean;
}

export interface PdfReference {
  page: number;
  excerpt?: string;
}

export interface ChatSession {
  vehicleId: string;
  documentId: string;
  messages: ChatMessage[];
}
