import { describe, expect, it } from "vitest";
import en from "./resource/en/en.json";
import th from "./resource/th/th.json";
import {
  collectTranslationKeys,
  findMissingTranslationKeys,
} from "./keyParity";

describe("translation resources", () => {
  it("contains the same keys in English and Thai", () => {
    expect(findMissingTranslationKeys(en, th)).toEqual([]);
    expect(findMissingTranslationKeys(th, en)).toEqual([]);
  });

  it("collects nested keys", () => {
    expect(
      collectTranslationKeys({
        auth: {
          login: "Login",
          errors: {
            invalid: "Invalid",
          },
        },
      }),
    ).toEqual(["auth.login", "auth.errors.invalid"]);
  });

  it("reports missing nested keys", () => {
    expect(
      findMissingTranslationKeys(
        {
          auth: {
            login: "Login",
            password: "Password",
          },
        },
        {
          auth: {
            login: "เข้าสู่ระบบ",
          },
        },
      ),
    ).toEqual(["auth.password"]);
  });
});
