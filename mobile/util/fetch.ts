const SERVER_URL = 'http://192.168.0.13:8000';

async function callMethodRaw(
  method: string,
  path: string,
  data: object | null = null,
  auth?: string,
): Promise<Response> {
  if (path.startsWith('/')) path = path.substr(1);
  const headers: {
    'Accept': string;
    'Content-Type'?: string;
    'Authorization'?: string;
  } = { 'Accept': 'application/json' };
  const request: RequestInit = { method, headers };
  if (data !== null) {
    headers['Content-Type'] = 'application/json';
    request.body = JSON.stringify(data);
  }
  if (auth !== undefined) headers['Authorization'] = `Bearer ${auth}`;
  const response = await fetch(`${SERVER_URL}/${path}`, request);
  if (!response.ok) throw response.status;
  return response;
}

export async function callMethod<T>(
  method: string,
  path: string,
  data: object | null = null,
  auth?: string,
): Promise<T> {
  return await (await callMethodRaw(method, path, data, auth)).json() as T;
}

export async function callPost<T>(
  path: string,
  auth: string,
  data: object | null = null,
): Promise<T> {
  return await callMethod('POST', path, data, auth);
}

export async function callGet<T>(
  path: string,
  auth: string,
  data: object | null = null,
): Promise<T> {
  return await callMethod('GET', path, data, auth);
}

export async function callDelete(
  path: string,
  auth: string,
  data: object | null = null,
): Promise<Response> {
  return await callMethodRaw('DELETE', path, data, auth);
}
