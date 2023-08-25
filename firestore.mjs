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
  //convのやつ
  async resetConv(id) {
    try {
      const docRef = doc(this.db, "Convs", id);
      await setDoc(docRef, {
      });
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  async writeConv(messages, id) {
    try {
      const docRef = doc(this.db, "Convs", id);
  
      const conversationData = []; // 会話データを格納する配列
  
      // messages のデータを連続した会話データとして conversationData に格納
      messages.forEach((message) => {
        conversationData.push({
          userMessage: message.userMessage,
          aiResponse: message.aiResponse,
        });
      });
  
      // 保存する会話データが最大数を超える場合、古いデータを削除
      if (conversationData.length > 4) {
        conversationData.splice(0, conversationData.length - MAX_CONVERSATION_HISTORY);
      }
  
      await setDoc(docRef, { conversation: conversationData });
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
  
  

  async readConv(userid) {
    try {
      const docRef = doc(this.db, "Convs", userid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().conversation || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
      return [];
    }
  }

  async resetConv(docId) {
    try {
      const a = null;
      const docRef = doc(this.db, "Convs", docId);
      await setDoc(docRef, {
        a
      });
      console.log("Document written with ID: ", docId);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
}

export { database };
