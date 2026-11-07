import { readFileSync } from "node:fs";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";

initializeApp({
    projectId: "demo-nex-campaign-app",
});

const db = getFirestore();
const auth = getAuth();

const seed = JSON.parse(readFileSync('./seed/seed.json', 'utf8'));

const seedUsers = async () => {
    for (const user of seed.users) {
        try {
            await auth.getUsers(user.uid)
        } catch {
            await auth.createUser({uid: user.uid, email: user.email, password: `${user.id}-password`});
        }

        await auth.setCustomUserClaims(user.uid, { role: user.role });
        await db.doc(`users/${user.uid}`).set({
            email: user.email,
            role: user.role,
        });
    }
}

const seedSubmissionsAndCampaigns = async () => {
    const batch = db.batch();

    for (const {id, createdAt, ...submission} of seed.submissions) {
        const submissionRef = db.doc(`submissions/${id}`);
        batch.set(submissionRef, {
            ...submission,
            createdAt: Timestamp.fromDate(new Date(createdAt)),
        });
    }

    for (const {id, ...campaign} of seed.campaigns) {
        const campaignRef = db.doc(`campaigns/${id}`);
        batch.set(campaignRef, campaign);
    }

    await batch.commit();
}

await seedUsers();
await seedSubmissionsAndCampaigns();
console.log("Seeded 3 users, 2 campaigns, 6 submissions");