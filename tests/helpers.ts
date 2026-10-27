import { exampleForm, toBriefInput } from "../lib/form";
import { buildDemoDraft } from "../lib/demo";
import { BriefSchema, type Brief, type Draft } from "../lib/schema";

export function exampleBrief(): Brief {
  return BriefSchema.parse(toBriefInput(exampleForm()));
}

/** Корректный ответ «модели» для тестов — берём демо-черновик, он проходит ту же схему. */
export function validDraft(): Draft {
  return buildDemoDraft(exampleBrief());
}
