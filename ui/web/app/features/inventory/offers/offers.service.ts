import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize, firstValueFrom, from, Observable } from 'rxjs';
import { InventoryDataService, type Offer } from 'ui-shared';

@Injectable({
  providedIn: 'root',
})
export class OffersService {
  private dataService = inject(InventoryDataService);
  private http = inject(HttpClient);

  // State
  isLoading = signal(false);
  isActionLoading = signal(false);
  offers = this.dataService.offers;

  // Actions
  getOffersData(): Observable<Offer[]> {
    return this.http.get<Offer[]>(`${this.dataService.baseUrl}/offers`);
  }

  setOffers(data: Offer[]): void {
    this.dataService.setOffers(data);
  }

  addOffer(offer: Offer) {
    this.isActionLoading.set(true);
    const promise = firstValueFrom(this.http.post<Offer>(`${this.dataService.baseUrl}/offers`, offer)).then((data) => {
      this.dataService.addOfferToState(data);
    });
    return from(promise).pipe(finalize(() => this.isActionLoading.set(false)));
  }

  deleteOffer(id: string) {
    this.isActionLoading.set(true);
    const promise = firstValueFrom(this.http.delete(`${this.dataService.baseUrl}/offers/${id}`)).then(() => {
      this.dataService.removeOfferFromState(id);
    });
    return from(promise).pipe(finalize(() => this.isActionLoading.set(false)));
  }

  updateOffer(offer: Offer) {
    this.isActionLoading.set(true);
    const promise = firstValueFrom(this.http.put<Offer>(`${this.dataService.baseUrl}/offers/${offer.id}`, offer)).then(
      (data) => {
        this.dataService.updateOfferInState(data);
      },
    );
    return from(promise).pipe(finalize(() => this.isActionLoading.set(false)));
  }
}
