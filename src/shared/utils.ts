export function joinArrayForPrint(values: string[]): string {
  return "- " + values.join("\n- ");
}

export function formatResult(result: { errors?: string[]; warnings?: string[] }): string {
  const { errors, warnings } = result;

  const sections: string[] = [];
  if (errors && errors.length > 0) sections.push("Errors:\n" + joinArrayForPrint(errors));
  if (warnings && warnings.length > 0) sections.push("Warnings:\n" + joinArrayForPrint(warnings));

  return sections.length === 0 ? "" : sections.join(sections.length === 1 ? "" : "\n\n");
}