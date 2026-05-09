
/** the port on which the non-ssl http requests are served */
export const HTTP_PORT = process.env.PORT || 36865;
export const IS_AZURE_ENV = !!process.env.WEBSITE_SITE_NAME;