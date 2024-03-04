import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  query,
  where,
  documentId,
} from 'firebase/firestore';
// import { getAnalytics } from 'firebase/analytics';
import { environment } from '../../../environments/environment.development';
import { SocketService } from '../socket/socket.service';
import { Projects } from '../../../types/app.types';

@Injectable({
  providedIn: 'root',
})
export class DbService {
  app;
  store;
  auth;
  constructor(private socketService: SocketService) {
    this.app = initializeApp(environment.firebaseConfig);
    this.store = getFirestore(this.app);
    this.auth = getAuth(this.app);
  }

  async createProject() {
    if (!this.auth.currentUser) return;
    try {
      const docRef = await addDoc(collection(this.store, 'projects'), {
        version: '',
        background: '',
        objects: [],
        user: this.auth.currentUser?.uid,
      });

      this.socketService.emit('room:join', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error(error);
      return;
    }
  }

  async getProjects() {
    if (!this.auth.currentUser) return;
    const projects: Projects[] = [];
    const q = query(
      collection(this.store, 'projects'),
      where('user', '==', this.auth.currentUser.uid)
    );

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      projects.push({ ...data, id: doc.id } as Projects);
    });
    return projects;
  }

  async getProjectsByIds(ids: string[] | string) {
    if (typeof ids === 'string') {
      ids = [ids];
    }
    try {
      const q = query(
        collection(this.store, 'projects'),
        where(documentId(), 'in', ids)
      );
      const querySnapshot = await getDocs(q);

   const data= querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log({data})
      return data
    } catch (error) {
      console.error('Error getting documents:', error);
    }
    return [];
  }

  async updateObjects(objects: string, id: string) {
    try {
      await updateDoc(doc(this.store, 'projects', id), {
        objects,
      });
    } catch (error) {
      console.error(error);
    }
  }
}
