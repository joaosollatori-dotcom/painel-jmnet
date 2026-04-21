const GENIE_NBI_URL = process.env.GENIEACS_NBI_URL || 'http://localhost:7557';

export class GenieACSService {

    private async request(path: string, options: RequestInit = {}) {
        const url = `${GENIE_NBI_URL}${path}`;
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            if (!response.ok) {
                throw new Error(`GenieACS API Error: ${response.statusText}`);
            }

            if (response.status === 204) return null;
            return await response.json();
        } catch (error) {
            console.error(`Fetch error at ${url}:`, error);
            throw error;
        }
    }

    async listDevices() {
        // Projeção dos campos essenciais para performance
        const projection = [
            '_id', '_lastInform', '_tags',
            'InternetGatewayDevice.DeviceInfo.Manufacturer',
            'InternetGatewayDevice.DeviceInfo.ModelName',
            'InternetGatewayDevice.DeviceInfo.SerialNumber',
            'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ExternalIPAddress'
        ].join(',');

        return this.request(`/devices/?projection=${projection}`);
    }

    async getDeviceDetails(deviceId: string) {
        // Busca profunda do dispositivo
        const query = encodeURIComponent(JSON.stringify({ _id: deviceId }));
        const data = await this.request(`/devices/?query=${query}`);
        return data && data.length > 0 ? data[0] : null;
    }

    async createTask(deviceId: string, task: any, connectionRequest = true) {
        const url = `/devices/${deviceId}/tasks${connectionRequest ? '?connection_request' : ''}`;
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(task),
        });
    }

    // AÇÕES RÁPIDAS
    async reboot(deviceId: string) {
        return this.createTask(deviceId, { name: 'reboot' });
    }

    async refresh(deviceId: string) {
        // Refresh total do objeto DeviceInfo
        return this.createTask(deviceId, { name: 'refreshObject', objectName: '' });
    }

    async getSignalData(deviceId: string) {
        const device = await this.getDeviceDetails(deviceId);
        if (!device) return null;

        // Mapeamento de sinais (varia por fabricante, ex: Huawei)
        // Tenta caminhos comuns de sinal óptico
        const rx = device.InternetGatewayDevice?.X_PON_InterfaceConfig?.OpticalInfo?.RxPower ||
            device.Device?.Optical?.Interface?.['1']?.Stats?.OpticalSignalLevel ||
            -20; // Mock se não encontrar no simulador padrão

        return {
            rxPower: parseFloat(rx),
            online: (new Date().getTime() - new Date(device._lastInform).getTime()) < 600000 // 10 min
        };
    }
}
