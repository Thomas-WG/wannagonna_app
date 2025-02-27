/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

// Initialize Firebase Admin
initializeApp();

export const onApplicationCreatedUpdateApplicantsCount = onDocumentCreated(
    "activities/{activityId}/applications/{applicationId}",
    async (event) => {
      const db = getFirestore();
      console.log("Application created", {structuredData: true});

      // You can access the data like this:
      const applicationData = event.data.data();
      console.log(applicationData);
      const activityId = event.params.activityId;
      console.log(activityId);
      return db.runTransaction(async (transaction) => {
        const activityRef = db.collection("activities").doc(activityId);
        const snap = await transaction.get(activityRef);
        const activity = snap.data();
        activity.applicants = activity.applicants + 1;
        console.log("update of applicants :", activity.applicants);
        transaction.set(activityRef, activity);
      });
    },
);
