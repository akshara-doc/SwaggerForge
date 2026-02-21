import { JSONPath } from 'jsonpath-plus';

export function parseJSONInput(text: string): any {
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('Invalid JSON format');
  }
}

export function evaluateJSONPath(json: any, path: string): any {
  try {
    if (!path) return json;
    return JSONPath({ path, json });
  } catch (e) {
    throw new Error('Invalid JSONPath expression');
  }
}

export function getKeysFromJSON(json: any, prefix = '$'): { label: string; value: string }[] {
  const keys: { label: string; value: string }[] = [];

  function traverse(obj: any, path: string) {
    if (Array.isArray(obj)) {
      keys.push({ label: `${path}[*]`, value: `${path}[*]` });
      if (obj.length > 0) {
        traverse(obj[0], `${path}[0]`);
      }
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach((key) => {
        const currentPath = path === '$' ? `$.${key}` : `${path}.${key}`;
        keys.push({ label: currentPath, value: currentPath });
        traverse(obj[key], currentPath);
      });
    }
  }

  traverse(json, prefix);
  return keys;
}
