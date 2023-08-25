// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
class setupFirebase {
  setup() {
    const firebaseConfig = {
      apiKey: "AIzaSyCknESoBNne1SWVQXTqMvjH9unskU5z4ac",
      authDomain: "line-bot-e7d6e.firebaseapp.com",
      projectId: "line-bot-e7d6e",
      storageBucket: "line-bot-e7d6e.appspot.com",
      messagingSenderId: "477903788311",
      appId: "1:477903788311:web:fe26375025b8d9b2faff52",
      measurementId: "G-8ZQSF1MZ9X"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);

    return app;
  }
}

export { setupFirebase };
