import { preset } from "$/providers/models.ts";
import Google from "$/providers/chat/google.ts";
import { UnprocessableContent } from "$/utils/errors.ts";

export function getClient(model: string) {
  const modelCard = preset.find((m) => m.id === model);
  if (!modelCard) {
    throw new UnprocessableContent(`Unsupport model.`);
  }

  switch (modelCard.owned_by) {
    case "google":
      return Google;
    default:
      throw new UnprocessableContent(`Unsupport model.`);
  }
}
