import {
  DEFAULT_FEE_SETTINGS,
  FeeSettings,
  getFeeSettings,
  updateFeeSettings,
} from './fee-settings';
import {
  isTestStorageBypassed,
  readPersistedJson,
  writePersistedJson,
} from '@/lib/storage/json-store';

const FEE_SETTINGS_FILENAME = 'fee-settings.json';

const globalServerFeeState = globalThis as unknown as {
  __FEE_SETTINGS_HYDRATED__?: boolean;
};

function ensureHydratedFromDisk(): void {
  if (globalServerFeeState.__FEE_SETTINGS_HYDRATED__ || isTestStorageBypassed()) {
    return;
  }
  globalServerFeeState.__FEE_SETTINGS_HYDRATED__ = true;

  const persisted = readPersistedJson<Partial<FeeSettings>>(FEE_SETTINGS_FILENAME);
  if (persisted && typeof persisted === 'object') {
    updateFeeSettings(
      { ...DEFAULT_FEE_SETTINGS, ...persisted },
      persisted.updatedBy || DEFAULT_FEE_SETTINGS.updatedBy
    );
  }
}

export function getServerFeeSettings(): FeeSettings {
  ensureHydratedFromDisk();
  return getFeeSettings();
}

export function updateServerFeeSettings(
  updates: Partial<FeeSettings>,
  updatedBy: string = 'Manager'
): FeeSettings {
  ensureHydratedFromDisk();
  const next = updateFeeSettings(updates, updatedBy);
  writePersistedJson(FEE_SETTINGS_FILENAME, next);
  return next;
}

