import packageJson from "../package.json";

/** Keep the visible application version aligned with installer/npm metadata. */
export const APP_VERSION: string = packageJson.version;
