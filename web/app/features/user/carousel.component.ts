import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { UserService } from './user.service';

@Component({
  selector: 'app-carousel',
  imports: [CommonModule],
  template: `
    <div class="flex flex-col">
      <div class="overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 sm:px-6 lg:px-8">
          <div class="overflow-hidden">
            <table
              class="min-w-full text-left text-sm font-light text-surface dark:text-white"
            >
              <thead
                class="border-b border-neutral-200 font-medium dark:border-white/10"
              >
                <tr>
                  <th scope="col" class="px-6 py-4">#</th>
                  <th scope="col" class="px-6 py-4">Name</th>
                  <th scope="col" class="px-6 py-4">User Name</th>
                  <th scope="col" class="px-6 py-4">Email</th>
                  <th scope="col" class="px-6 py-4">Phone</th>
                </tr>
              </thead>
              <tbody>
                @for (user of userService.users(); track $index) {
                  <tr class="border-b border-neutral-200 dark:border-white/10">
                    <th class="whitespace-nowrap px-6 py-4 font-medium">
                      {{ user.id }}
                    </th>
                    <td class="whitespace-nowrap px-6 py-4">{{ user.name }}</td>
                    <td>{{ user.username }}</td>
                    <td>{{ user.email }}</td>
                    <td>{{ user.phone }}</td>
                  </tr>
                } @empty {
                  <td colspan="4">No users found ...</td>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export class CarouselComponent implements OnInit {
  constructor(public userService: UserService) {}

  ngOnInit() {
    this.userService.getUsers();
  }
}
