export function formatJson(json: any) {
  let formattedJson = JSON.stringify(json, null, 2);

  formattedJson = formattedJson.replace(/(\[[\d,\s]+?\])/g, function (match) {
    return match.replace(/\s+/g, " ");
  });

  return formattedJson;
}

export function log(message: string) {
  console.log(message);
}

export function $(query: string): HTMLElement {
  return document.querySelector(query)!;
}

export function $$(query: string): HTMLElement[] {
  return [...document.querySelectorAll(query)]! as HTMLElement[];
}
