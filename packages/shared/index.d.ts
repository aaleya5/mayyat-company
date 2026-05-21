export type Role = "ADMIN" | "VIEWER";

export interface RecordRow {
  id: string;
  srNo: number;
  name: string;
  ageText?: string;
  gender: "MALE" | "FEMALE" | "UNKNOWN";
}
