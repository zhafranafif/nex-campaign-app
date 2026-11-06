
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const PROJECT_ID = "demo-nex-campaign-app";

const testEnv = await initializeTestEnvironment({
  projectId: PROJECT_ID,

  firestore: {
    host: "127.0.0.1",
    port: 8080,
    rules: readFileSync(
      resolve(process.cwd(), "firestore.rules"),
      "utf8"
    ),
  },
});

beforeAll(async () => {
  await testEnv.clearFirestore();
});

beforeEach(async () => {
  // Seed test data without applying security rules.
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), "submissions", "submission-001"),
      {
        creatorId: "creator-001",
        campaignId: "campaign-001",
        videoUrl: "https://www.tiktok.com/example",
        status: "pending",
      }
    );
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("Firestore Security Rules - submissions", () => {
  it("allows a creator to read their own submission", async () => {
    const creatorDb = testEnv
      .authenticatedContext("creator-001", {
        role: "creator",
      })
      .firestore();

    await assertSucceeds(
      getDoc(doc(creatorDb, "submissions", "submission-001"))
    );
  });

  it("denies a creator from reading another creator's submission", async () => {
    const creatorDb = testEnv
      .authenticatedContext("creator-002", {
        role: "creator",
      })
      .firestore();

    await assertFails(
      getDoc(doc(creatorDb, "submissions", "submission-001"))
    );
  });

  it("denies a creator from creating a submission with status", async () => {
    const creatorDb = testEnv
      .authenticatedContext("creator-001", {
        role: "creator",
      })
      .firestore();

    await assertFails(
      setDoc(doc(creatorDb, "submissions", "submission-002"), {
        creatorId: "creator-001",
        campaignId: "campaign-001",
        videoUrl: "https://www.tiktok.com/example",
        status: "approved",
      })
    );
  });
});
