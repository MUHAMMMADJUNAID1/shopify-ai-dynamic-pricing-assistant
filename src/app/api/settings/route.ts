import { apiError, apiJson, getErrorMessage } from "@/server/http/json";
import {
  getSettings,
  updateSettings,
} from "@/server/repositories/settings.repository";
import { settingsInputSchema } from "@/server/schemas/settings.schema";
import { serializeSettings } from "@/server/serializers";

export async function GET() {
  try {
    const settings = await getSettings();
    return apiJson({ settings: serializeSettings(settings) });
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json();
    const input = settingsInputSchema.parse(payload);
    const settings = await updateSettings(input);

    return apiJson({ settings: serializeSettings(settings) });
  } catch (error) {
    return apiError(getErrorMessage(error), 400);
  }
}
