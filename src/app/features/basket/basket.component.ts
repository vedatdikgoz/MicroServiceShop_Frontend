import { Component, OnInit } from '@angular/core';
import { BasketService } from '../../services/basket.service';
import { BasketItem } from '../../models/basket/basketItem';
import { Basket } from '../../models/basket/basket';
import { catchError, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'basket',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './basket.component.html',
  styleUrl: './basket.component.css'
})
export class BasketComponent implements OnInit {

  basket = new Basket();
  basketItems: BasketItem[] = [];
  loading = false;
  counter: number = 1;
  discountCode: string = '';  // Formdan alınan indirim kodunu tutacak değişken
  isDiscountApplied: boolean | null = null;  // İndirim kodunun başarılı olup olmadığını tutacak değişken

  constructor(
    private basketService: BasketService) {}

  ngOnInit() {
    this.loadBasket();
  }

  increment() {
    this.counter++;
  }

  decrement() {
    if (this.counter > 1) {
      this.counter--;
    }
  }



  loadBasket(): void {
    this.basketService.get().subscribe({
      next: (basket: Basket) => {
        if (basket) {
          this.basket = basket;
          this.basketItems = (basket.basketItems || []).map(item => Object.assign(new BasketItem(), item));
        } else {
          // Eğer basket undefined ise, boş bir sepet ve basketItems oluştur.
          this.basket = new Basket();
          this.basketItems = [];
        }
      },
      error: (error) => {
        console.error('Sepet verisini alırken bir hata oluştu:', error);
      }
    });
  }



  applyDiscount(): void {
    this.basketService.applyDiscount(this.discountCode).subscribe((result) => {  
      if (result) {
        this.isDiscountApplied = true;
        console.log('Discount applied successfully');
      } else {
        this.isDiscountApplied = false;
        console.log('Failed to apply discount');
      }
    });
  }


  removeBasketItem(productId: string) {
    if (productId) {
      this.basketService.removeBasketItem(productId).pipe(
        catchError(err => {
          console.error('Error removing item', err);
          return of(false);
        })
      ).subscribe(success => {
        if (success) {
          this.loadBasket();
        }
      });
    }
  }

}
