import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore'

class database {
  db;
  constructor(app) {
    this.db = getFirestore(app);
  }


  async writeUser() {
    try {
      const docRef = await addDoc(collection(this.db, "Users"), {
        name: "泉秀哉",
        exp: 334,
        level: 20,
        state: "NONE"
      });
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  async readUser() {
    const querySnapshot = await getDocs(collection(this.db, "Users"));
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} => ${doc.data()}`);
    });
  }
}

export { database };
