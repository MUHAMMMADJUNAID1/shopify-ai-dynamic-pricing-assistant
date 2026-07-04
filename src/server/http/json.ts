import { NextResponse } from "next/server";

export function apiJson<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function apiError(message: string, status = 500) {
  return apiJson({ error: message }, { status });
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error.";
}
