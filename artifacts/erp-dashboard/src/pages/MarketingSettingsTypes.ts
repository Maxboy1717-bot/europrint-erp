/**
 * @module MarketingSettingsTypes
 * @description TypeScript interfaces, types, and constants for MarketingSettings.
 */

export interface SocialApiConfig {
  id: string;
  platform: string;
  apiKey: string | null;
  apiSecret: string | null;
  accessToken: string | null;
  pageId: string | null;
  webhookSecret: string | null;
  isActive: boolean;
}

export interface SettingFormState {
  key: string;
  value: string;
  category: string;
  description: string;
}

export interface ApiFormState {
  platform: string;
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  pageId: string;
  webhookSecret: string;
  isActive: boolean;
}

export const DEFAULT_SETTING_FORM: SettingFormState = {
  key: "",
  value: "",
  category: "general",
  description: "",
};

export const DEFAULT_API_FORM: ApiFormState = {
  platform: "instagram",
  apiKey: "",
  apiSecret: "",
  accessToken: "",
  pageId: "",
  webhookSecret: "",
  isActive: true,
};
