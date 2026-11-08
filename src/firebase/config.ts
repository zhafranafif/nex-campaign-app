import { initializeApp } from "firebase/app"

import {
  getAuth,
  connectAuthEmulator,
} from "firebase/auth";

import {
  getFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";

import {
  getFunctions,
  connectFunctionsEmulator,
} from "firebase/functions";


const firebaseConfig = {
    apiKey: 'demo-api-key',
    authDomain: 'demo-nex-campaign-app.firebaseapp.com',
    projectId: 'demo-nex-campaign-app',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app)

if (window.location.hostname === 'localhost') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099')
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
    connectFunctionsEmulator(functions, '127.0.0.1', 5001)
}
