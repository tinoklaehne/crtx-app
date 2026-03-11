export type FeedbackType = "Bug" | "Idea";

export interface FeedbackInput {
  title: string;
  description: string;
  type: FeedbackType;
  area?: string;
  severity?: "Low" | "Medium" | "High" | "Critical";
  stepsToReproduce?: string;
  environment?: string;
  screenshotUrl?: string;
}

export interface FeedbackRecord extends FeedbackInput {
  id: string;
  userId: string;
  submittedAt: string;
  status: "New" | "Triaged" | "In Progress" | "Done" | "Rejected";
}

