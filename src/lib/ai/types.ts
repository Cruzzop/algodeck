export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiExplanation = {
  summary: string;
  pattern: string;
  timeComplexity: string;
  spaceComplexity: string;
  steps: string[];
  edgeCases: string[];
  interviewTip: string;
};

export type AiCoachReport = {
  headline: string;
  assessment: string;
  focus: string;
  why: string;
  plan: string[];
};

export type AiHintResponse = {
  hint: string;
  stage: number;
  model: string;
};

export type AiExplainResponse = {
  explanation: AiExplanation | null;
  raw: string | null;
  model: string;
};

export type AiCoachResponse = {
  report: AiCoachReport | null;
  raw: string | null;
  model: string;
};

export type AiStatus = {
  enabled: boolean;
  configuredModel: string | null;
  freeModelCount: number;
  chain: string[];
  lastGoodModel: string | null;
};
