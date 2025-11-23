import { GlobalState } from '@/types/state';

const SERVER_URL = 'http://192.168.0.13:8000';

async function callMethodRaw(
  method: string,
  path: string,
  data: object | null = null,
  state: GlobalState | null = null,
  retry: boolean = true,
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
  if (state?.accessToken !== null) {
    headers['Authorization'] = `Bearer ${state!.accessToken!}`;
  }
  const response = await fetch(`${SERVER_URL}/${path}`, request);
  if (!response.ok) {
    if (state?.refreshToken !== null && retry) {
      try {
        const { access } = await callPost<{ access: string }>(
          '/api/auth/token/refresh/',
          state!,
          { refresh: state!.refreshToken! },
        );
        state!.setAccessToken(access);
        return await callMethodRaw(method, path, data, state, false);
      } catch(e) {}
    }
    throw response.status;
  }
  return response;
}

export async function callMethod<T>(
  method: string,
  path: string,
  data: object | null = null,
  state: GlobalState | null = null,
): Promise<T> {
  const raw = await callMethodRaw(method, path, data, state);
  return await raw.json() as T;
}

export async function callPost<T>(
  path: string,
  state: GlobalState,
  data: object | null = null,
): Promise<T> {
  return await callMethod('POST', path, data, state);
}

export async function callGet<T>(
  path: string,
  state: GlobalState,
  data: object | null = null,
): Promise<T> {
  return await callMethod('GET', path, data, state);
}

export async function callDelete(
  path: string,
  state: GlobalState,
  data: object | null = null,
): Promise<Response> {
  return await callMethodRaw('DELETE', path, data, state);
}
