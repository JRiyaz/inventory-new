import { HttpClient } from '@angular/common/http';
import { Injectable, signal, type WritableSignal } from '@angular/core';
import type { User } from './user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl = 'https://jsonplaceholder.typicode.com/users';
  users: WritableSignal<User[]> = signal([]);

  constructor(private readonly http: HttpClient) {}

  getUsers() {
    this.http.get<User[]>(this.apiUrl).subscribe((users) => this.users.set(users));
  }
}
