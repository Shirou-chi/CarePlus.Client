import { baseUrl, messageFromBody, request } from "./api";
import type { ApiResponse } from "./api";
import type { CurrentUserResponse } from "./authApi";

export type ProfileUpdateRequest = {
    name?: string;
    email?: string;
    phone?: string;
    gender?: string;
    address?: string;
};

export type AppSettingResponse = {
    appearance: string;
    language: string | null;
    notification: string | null;
};

export type PaymentCardResponse = {
    id: number;
    brand: string;
    last4: string;
    expiry: string;
    holderName: string;
    isDefault: boolean;
};

export type PaymentCardSaveRequest = {
    number: string;
    expiry: string;
    holderName: string;
    cvv: string;
};

export type AppSettingSaveRequest = {
    appearance?: string;
    language?: string;
    notification?: string;
};

export type DeliveryAddressResponse = {
    id: number;
    label: string;
    unit: string;
    address: string;
    isDefault: boolean;
};

async function unwrap<T>(result: ApiResponse<T>, failureMessage: string): Promise<T> {
    if (!result.isSuccess || result.data == null) {
        throw new Error(messageFromBody(result, failureMessage));
    }

    return result.data;
}

export const profilePictureUrl = (path: string | null | undefined) => {
    if (!path) {
        return null;
    }
    return `${baseUrl}/api/${path.replace(/^\//, "")}`;
};

export const profileApi = {
    async uploadPhoto(file: File): Promise<CurrentUserResponse> {
        const body = new FormData();
        body.append("file", file);
        const result = await request<ApiResponse<CurrentUserResponse>>("/api/User/Photo", { method: "POST", body }, true);
        return unwrap(result, "Unable to save the photo.");
    },

    async changePassword(body: { currentPassword: string; newPassword: string }): Promise<void> {
        const result = await request<ApiResponse<{ updated: boolean }>>(
            "/api/User/Password",
            { method: "PUT", body: JSON.stringify(body) },
            true,
        );
        if (!result.isSuccess) {
            throw new Error(messageFromBody(result, "Unable to update the password."));
        }
    },

    async updateProfile(patch: ProfileUpdateRequest): Promise<CurrentUserResponse> {
        const result = await request<ApiResponse<CurrentUserResponse>>(
            "/api/User/Me",
            { method: "PUT", body: JSON.stringify(patch) },
            true,
        );
        return unwrap(result, "Unable to update profile.");
    },

    async listDeliveryAddresses(): Promise<DeliveryAddressResponse[]> {
        const result = await request<ApiResponse<DeliveryAddressResponse[]>>("/api/User/DeliveryAddress", { method: "GET" }, true);
        return unwrap(result, "Unable to load delivery addresses.");
    },

    async addDeliveryAddress(body: { label: string; unit: string; address: string; isDefault: boolean }): Promise<DeliveryAddressResponse[]> {
        const result = await request<ApiResponse<DeliveryAddressResponse[]>>(
            "/api/User/DeliveryAddress",
            { method: "POST", body: JSON.stringify(body) },
            true,
        );
        return unwrap(result, "Unable to save the delivery address.");
    },

    async updateDeliveryAddress(id: number, body: { label: string; unit: string; address: string }): Promise<DeliveryAddressResponse[]> {
        const result = await request<ApiResponse<DeliveryAddressResponse[]>>(
            `/api/User/DeliveryAddress/${id}`,
            { method: "PUT", body: JSON.stringify(body) },
            true,
        );
        return unwrap(result, "Unable to save the delivery address.");
    },

    async deleteDeliveryAddress(id: number): Promise<DeliveryAddressResponse[]> {
        const result = await request<ApiResponse<DeliveryAddressResponse[]>>(`/api/User/DeliveryAddress/${id}`, { method: "DELETE" }, true);
        return unwrap(result, "Unable to remove the delivery address.");
    },

    async getAppSetting(): Promise<AppSettingResponse | null> {
        const result = await request<ApiResponse<AppSettingResponse | null>>("/api/User/AppSetting", { method: "GET" }, true);
        if (!result.isSuccess) {
            throw new Error(messageFromBody(result, "Unable to load preferences."));
        }
        return result.data ?? null;
    },

    async saveAppSetting(body: AppSettingSaveRequest): Promise<AppSettingResponse> {
        const result = await request<ApiResponse<AppSettingResponse>>(
            "/api/User/AppSetting",
            { method: "PUT", body: JSON.stringify(body) },
            true,
        );
        return unwrap(result, "Unable to save preferences.");
    },

    async listPaymentCards(): Promise<PaymentCardResponse[]> {
        const result = await request<ApiResponse<PaymentCardResponse[]>>("/api/User/PaymentCard", { method: "GET" }, true);
        return unwrap(result, "Unable to load saved cards.");
    },

    async addPaymentCard(body: PaymentCardSaveRequest): Promise<PaymentCardResponse[]> {
        const result = await request<ApiResponse<PaymentCardResponse[]>>(
            "/api/User/PaymentCard",
            { method: "POST", body: JSON.stringify(body) },
            true,
        );
        return unwrap(result, "Unable to save the card.");
    },

    async updatePaymentCard(id: number, body: PaymentCardSaveRequest): Promise<PaymentCardResponse[]> {
        const result = await request<ApiResponse<PaymentCardResponse[]>>(
            `/api/User/PaymentCard/${id}`,
            { method: "PUT", body: JSON.stringify(body) },
            true,
        );
        return unwrap(result, "Unable to save the card.");
    },

    async deletePaymentCard(id: number): Promise<PaymentCardResponse[]> {
        const result = await request<ApiResponse<PaymentCardResponse[]>>(`/api/User/PaymentCard/${id}`, { method: "DELETE" }, true);
        return unwrap(result, "Unable to remove the card.");
    },

    async setDefaultPaymentCard(id: number): Promise<PaymentCardResponse[]> {
        const result = await request<ApiResponse<PaymentCardResponse[]>>(
            "/api/User/PaymentCard/Default",
            { method: "PUT", body: JSON.stringify({ id }) },
            true,
        );
        return unwrap(result, "Unable to update the default card.");
    },

    async setDefaultDeliveryAddress(id: number | null): Promise<DeliveryAddressResponse[]> {
        const result = await request<ApiResponse<DeliveryAddressResponse[]>>(
            "/api/User/DeliveryAddress/Default",
            { method: "PUT", body: JSON.stringify({ id }) },
            true,
        );
        return unwrap(result, "Unable to update the default address.");
    },
};
