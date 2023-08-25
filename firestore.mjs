import { getFirestore, setDoc, getDoc, getDocs, doc, collection } from 'firebase/firestore'

class database {
  db;
  constructor(app) {
    this.db = getFirestore(app);
  }


  async writeUser(docId, n, e, l, s) {
    try {
      const docRef = doc(this.db, "Users", docId);
      await setDoc(docRef, {
        name: n,
        exp: e,
        level: l,
        state: s
      });
      console.log("Document written with ID: ", docId);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  async readUser(docId) {
    try {
      const docRef = doc(this.db, "Users", docId);
      const docSnapshot = await getDoc(docRef);
      if (docSnapshot.exists()) {
        return docSnapshot.data();
      } else {
        return null;
      }
    } catch (e) {
      console.error("Error getting document: ", e);
      return null;
    }
  }

  async getUserIds() {
    const usersCollectionRef = collection(this.db, "Users");
    const querySnapshot = await getDocs(usersCollectionRef);

    let userIds = [];
    querySnapshot.forEach((doc) => {
      userIds.push(doc.id);
    });
    return userIds;
  }
}

export { database };
