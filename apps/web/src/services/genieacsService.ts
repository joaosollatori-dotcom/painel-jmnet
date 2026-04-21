const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/v1';

export interface GenieDevice {
    _id: string;
    _lastInform: string;
    _tags: string[];
    InternetGatewayDevice?: {
        DeviceInfo?: {
            Manufacturer?: string;
            ModelName?: string;
            SerialNumber?: string;
        }
    };
}

export const getGenieDevices = async () => {
    const response = await fetch(`${API_URL}/genieacs/devices`);
    const json = await response.json();
    return json.data;
};

export const getDeviceSignal = async (id: string) => {
    const response = await fetch(`${API_URL}/genieacs/devices/${id}/signal`);
    const json = await response.json();
    return json.data;
};

export const rebootDevice = async (id: string) => {
    const response = await fetch(`${API_URL}/genieacs/devices/${id}/reboot`, { method: 'POST' });
    return response.json();
};

export const refreshDevice = async (id: string) => {
    const response = await fetch(`${API_URL}/genieacs/devices/${id}/refresh`, { method: 'POST' });
    return response.json();
};
