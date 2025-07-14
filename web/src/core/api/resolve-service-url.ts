// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { env } from "~/env.js";

export function resolveServiceURL(path: string) {
  let BASE_URL = env.NEXT_PUBLIC_API_URL ?? "http://localhost:9090/api";
  if (!BASE_URL.endsWith("/")) {
    BASE_URL += "/";
  }
  return new URL(path, BASE_URL).toString();
}
