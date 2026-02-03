export type UserRole = "ORG_ADMIN" | "PM_STAFF" | "OWNER" | "TENANT";

export interface AppConfig {
  apiBaseUrl: string;
  cognito: {
    userPoolId: string | undefined;
    clientId: string | undefined;
    domain: string | undefined;
  };
  devMockAuth: boolean;
}

export function getAppConfig(): AppConfig {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  return {
    apiBaseUrl,
    cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN
    },
    devMockAuth:
      process.env.NEXT_PUBLIC_DEV_ONLY_MOCK_AUTH === "true" ||
      process.env.DEV_ONLY_MOCK_AUTH === "true"
  };
}
