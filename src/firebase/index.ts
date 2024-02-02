import firebase from "firebase-admin";
import path from "path";

const serviceAccount = require(path.join(
  __dirname,
  "..",
  "..",
  "files",
  "serviceAccount.json"
));

export const initializeFirebase = () => {
  firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
  });
};

export const sendPush = (
  token: string,
  title: string,
  body: string,
  link?: string
) => {
  return firebase.messaging().send({
    token: token,
    webpush: {
      notification: {
        title: title,
        body: body,
        icon: "https://test.xn--2z1ba422lbqa.com/logo.png",
      },
      fcmOptions: {
        link: link,
      },
    },
  });
};

export const sendMultiPush = (
  tokens: string[],
  title: string,
  body: string,
  link?: string
) => {
  return firebase.messaging().sendMulticast({
    tokens: tokens,
    webpush: {
      notification: {
        title: title,
        body: body,
        icon: "https://test.xn--2z1ba422lbqa.com/logo.png",
      },
      fcmOptions: {
        link: link,
      },
    },
  });
};
