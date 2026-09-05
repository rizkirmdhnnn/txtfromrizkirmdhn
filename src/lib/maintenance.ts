import { z } from "zod";
const message = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(1000),
});
export const maintenanceSchema = z.object({
  enabled: z.boolean(),
  translations: z.object({ id: message, en: message }),
});
export type Maintenance = z.infer<typeof maintenanceSchema>;
export const defaultMaintenance: Maintenance = {
  enabled: false,
  translations: {
    id: {
      title: "Sedang dalam pemeliharaan",
      body: "Portofolio ini sedang diperbarui. Silakan kembali lagi nanti.",
    },
    en: {
      title: "Under maintenance",
      body: "This portfolio is being updated. Please check back soon.",
    },
  },
};
