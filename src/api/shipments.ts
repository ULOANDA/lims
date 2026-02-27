import api from "@/api/client";

export const shipmentApi = {
    list: (query?: any) => api.get("/v2/shipments/get/list", { query }),
    detail: (id: string) => api.get("/v2/shipments/get/detail", { query: { id } }),
    full: (id: string) => api.get("/v2/shipments/get/full", { query: { id } }),
    create: (body: any) => api.post("/v2/shipments/create", { body }),
    update: (body: any) => api.post("/v2/shipments/update", { body }),
    delete: (body: { shipmentId: string }) => api.post("/v2/shipments/delete", { body }),
};
