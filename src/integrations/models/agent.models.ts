export interface QuestionInput {
  user: string;
  assistant: string;
  question: string;
  assistantName: string;
  conversationId?: string | null;
  history?: string;
  memory?: boolean;
  networkUser?: string;
}

export interface ErrorResponse {
  status: 'ERROR';
  message: string;
}

