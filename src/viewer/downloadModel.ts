import stlSerializer from "@jscad/stl-serializer";
import type { JscadModel } from "./types";

export const downloadModelAsStl = (
  model: JscadModel,
  name: string = "model",
) => {
  const rawData = stlSerializer.serialize({ binary: true }, model);
  const blob = new Blob(rawData, { type: "application/octet-stream" });
  const data = window.URL.createObjectURL(blob);
  let link = document.createElement("a");
  link.href = data;
  link.download = `${name}.stl`;

  // this is necessary as link.click() does not work on the latest firefox
  link.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );

  setTimeout(() => {
    // For Firefox it is necessary to delay revoking the ObjectURL
    window.URL.revokeObjectURL(data);
    link.remove();
  }, 100);
};
