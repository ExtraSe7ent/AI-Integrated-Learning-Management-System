import type { Assessment, DemoData } from "./fixtures";
export const emptyAssessment: Assessment = {
  attempts: 0,
  draft: null,
  result: null,
};
export const assessmentFor = (data: DemoData, id: string) =>
  data.assessments[id] || emptyAssessment;
export function updateAssessment(
  data: DemoData,
  id: string,
  change: Partial<Assessment>,
): DemoData {
  return {
    ...data,
    assessments: {
      ...data.assessments,
      [id]: { ...assessmentFor(data, id), ...change },
    },
  };
}
