import { Injectable } from '@angular/core';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import { Router } from '@angular/router';
import { DbService } from '../db/db.service';
// import { app } from '../../firebase.config';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private router: Router, private dbService: DbService) {}
  auth = getAuth(this.dbService.app);

  signUp() {
    createUserWithEmailAndPassword(
      this.auth,
      'anuragdhurwey046@gmail.com',
      '100249'
    )
      .then((userCredential) => {
        const user = userCredential.user;
        console.log({ user });
        this.router.navigate(['/dashboard']);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log({ errorMessage });
      });
  }

  signIn() {
    signInWithEmailAndPassword(
      this.auth,
      'anuragdhurwey046@gmail.com',
      '100249'
    )
      .then((userCredential) => {
        const user = userCredential.user;
        console.log({ user });
        this.router.navigate(['/dashboard']);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log({ errorMessage });
      });
  }

  whenAuthStateChange(cb: (user: User | null) => void) {
    onAuthStateChanged(this.auth, (user) => {
      cb(user);
    });
  }

  async signOutUser() {
    try {
      await signOut(this.auth);
      this.router.navigate(['/sign-in']);
    } catch (error) {
      console.error(error);
    }
  }
}
