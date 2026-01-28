import type { EntityInfo } from "../common";

export type ClientInvoiceInfo = {
  taxCode?: string | null;
  taxName?: string | null;
  taxEmail?: string | null;
  taxAddress?: string | null;
  [key: string]: unknown;
};

export type ClientBase = {
  entity: EntityInfo;

  clientId: string;
  clientName: string;

  legalId: string | null;
  clientAddress: string | null;
  clientPhone: string | null;
  clientEmail: string | null;

  clientSaleScope: "public" | string | null;

  availableByIds: string[] | null;
  availableByName: string[] | null;

  clientContacts: unknown[] | null;
  invoiceInfo: ClientInvoiceInfo | null;

  totalOrderAmount: string | null;

  createdAt: string;
  createdById: string | null;
  modifiedAt: string;
  modifiedById: string | null;
  deletedAt: string | null;
};

export type ClientListItem = ClientBase & {
  total_count: string;
};

export type ClientDetail = ClientBase;

export type ClientsCreateBody = {
  clientName: string;

  legalId?: string | null;
  clientAddress?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;

  clientSaleScope?: "public" | string | null;

  availableByIds?: string[] | null;
  availableByName?: string[] | null;

  clientContacts?: unknown[] | null;
  invoiceInfo?: ClientInvoiceInfo | null;

  totalOrderAmount?: string | null;

  [key: string]: unknown;
};

export type ClientsUpdateBody = {
  clientId: string;

  clientName?: string;

  legalId?: string | null;
  clientAddress?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;

  clientSaleScope?: "public" | string | null;

  availableByIds?: string[] | null;
  availableByName?: string[] | null;

  clientContacts?: unknown[] | null;
  invoiceInfo?: ClientInvoiceInfo | null;

  totalOrderAmount?: string | null;

  [key: string]: unknown;
};
