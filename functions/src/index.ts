import { onCall } from "firebase-functions/v2/https";

export const helloWorld = onCall(() => {
  return { message: "Hello from Firebase!" };
});