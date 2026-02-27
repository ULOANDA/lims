import api from "./client";

export interface ApiInput {
    headers?: Record<string, string>;
    body?: any;
    query?: any;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: any;
}

export const login = async ({ headers, body, query }: ApiInput): Promise<ApiResponse> => {
    return api.post("/v2/auth/login", { headers, body, query });
};

export const logout = async ({ headers, body, query }: ApiInput): Promise<ApiResponse> => {
    return api.post("/v2/auth/logout", { headers, body, query });
};

export const verifyToken = async ({ headers, query }: ApiInput): Promise<ApiResponse> => {
    return api.get("/v2/auth/verify", { headers, query });
};
