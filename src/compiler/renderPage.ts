export const renderComponent = (html: string, props: any): string => {
  // Direct string replacement for props
  for (const [key, value] of Object.entries(props)) {
    html = html.split(`{{${key}}}`).join(String(value ?? ""));
  }

  return html;
};
