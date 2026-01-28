import api from "@/api/client";
import type { ApiResponse } from "@/api/client";
import type { IdParams, ListQuery, ListResponse, SortParams } from "./shared";
import type {
  ClientDetail,
  ClientListItem,
  ClientsCreateBody,
  ClientsUpdateBody,
} from "../../types/crm/client";

export type ClientsGetListInput = { query?: ListQuery; sort?: SortParams };
export async function clientsGetList(
  input: ClientsGetListInput = {}
): Promise<ListResponse<ClientListItem>> {
  const finalQuery: Record<string, unknown> = {
    ...(input.query ?? {}),
    ...(input.sort ?? {}),
  };
  return api.get("/v2/clients/get/list", {
    query: finalQuery,
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  }) as unknown as Promise<ListResponse<ClientListItem>>;
}

export type ClientsGetDetailInput = IdParams<"clientId">;
export async function clientsGetDetail(
  input: ClientsGetDetailInput
): Promise<ApiResponse<ClientDetail>> {
  return api.get("/v2/clients/get/detail", { query: input.params });
}

export type ClientsCreateInput = { body: ClientsCreateBody };
export async function clientsCreate(
  input: ClientsCreateInput
): Promise<ApiResponse<ClientDetail>> {
  return api.post("/v2/clients/create", { body: input.body });
}

export type ClientsUpdateInput = { body: ClientsUpdateBody };
export async function clientsUpdate(
  input: ClientsUpdateInput
): Promise<ApiResponse<ClientDetail>> {
  return api.post("/v2/clients/update", { body: input.body });
}

export type ClientsDeleteInput = IdParams<"clientId">;
export async function clientsDelete(
  input: ClientsDeleteInput
): Promise<ApiResponse<{ deleted: true }>> {
  return api.post("/v2/clients/delete", { body: input.params });
}
