let cachedPort = null;

export async function getApiBase() {
  if (window.electronAPI) {
    if (!cachedPort) {
      cachedPort = await window.electronAPI.getServerPort();
    }
    return cachedPort ? `http://localhost:${cachedPort}` : '';
  }
  return '';
}

export function resetApiBase() {
  cachedPort = null;
}

export function isElectron() {
  return !!window.electronAPI;
}
