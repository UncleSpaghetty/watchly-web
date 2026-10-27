const controllerName = process.env.LEGAL_CONTROLLER_NAME?.trim() ?? "";
const contactEmail = process.env.LEGAL_CONTACT_EMAIL?.trim() ?? "";
const controllerAddress = process.env.LEGAL_CONTROLLER_ADDRESS?.trim() ?? "";

export const legalConfig = {
  controllerName: controllerName || "Titolare di Watchly da configurare",
  contactEmail,
  controllerAddress,
  isComplete: Boolean(controllerName && contactEmail),
  lastUpdated: "27 ottobre 2026",
} as const;
