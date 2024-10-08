import { Component, NgZone } from '@angular/core';
import { ProductImage } from '../../models/catalog/productImage';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CatalogService } from '../../services/catalog.service';
import { catchError, of, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ProductDetail } from '../../models/catalog/productDetail';
import { CommentService } from '../../services/comment.service';
import { UserComment } from '../../models/comment/userComment';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product } from '../../models/catalog/product';
import { BasketItem } from '../../models/basket/basketItem';
import { BasketService } from '../../services/basket.service';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'client-product-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RouterLinkActive],
  templateUrl: './client-product-detail.component.html',
  styleUrl: './client-product-detail.component.css'
})
export class ClientProductDetailComponent {
  productId!: string | null;
  productImages: ProductImage[] = [];
  productComments: UserComment[] = [];
  productDetail!: ProductDetail;
  errorMessage: string = '';
  commentAddForm!: FormGroup;
  product!: Product;
  basketProduct!:Product;
  basketItem?: BasketItem;
  commentCounter: number = 0; // Gelen değeri saklayacak değişken
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private catalogService: CatalogService,
    public commentService: CommentService,
    private basketService: BasketService,
    private ngZone: NgZone,
    private toastr: ToastrService) 
    { 
      this.productId = this.route.snapshot.paramMap.get('id');

    if (this.productId) {
      this.loadProductImages(this.productId);
      this.loadProductDetail(this.productId);
      this.loadProductComments(this.productId);
      this.loadProduct(this.productId);
    } else {
      this.errorMessage = 'Product ID bulunamadı.';
    }
    }

  ngOnInit() {
    this.initializeForm();

    // Start the SignalR connection
    this.commentService.start();

    this.commentService.commentCounter$.subscribe((count: number) => {
      // NgZone ile Angular'ın değişiklik algılamasını tetikle
      this.ngZone.run(() => {
        this.commentCounter = count;
      });
    });

  }

  loadProductImages(productId: string): void {
    this.catalogService.getProductImages(productId).pipe(
      catchError((error) => {
        console.error('Ürün resimleri yüklenirken bir hata oluştu:', error);
        this.errorMessage = 'Ürün resimleri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.';
        return of([]);
      })
    ).subscribe((productImages: ProductImage[]) => {
      this.productImages = productImages;
    });
  }

  loadProductDetail(productId: string): void {
    this.catalogService.getProductDetail(productId).pipe(
      catchError((error) => {
        console.error('Ürün resimleri yüklenirken bir hata oluştu:', error);
        this.errorMessage = 'Ürün resimleri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.';
        return of("");
      })
    ).subscribe((response: any) => {
      this.productDetail = response.data;
    });
  }

  loadProduct(productId: string): void {
    this.catalogService.getProductById(productId).pipe(
      catchError((error) => {
        console.error('Ürün yüklenirken bir hata oluştu:', error);
        this.errorMessage = 'Ürün yüklenirken bir hata oluştu. Lütfen tekrar deneyin.';
        return of("");
      })
    ).subscribe((response: any) => {
      this.product = response.data;
      console.log(this.product)
    });
  }


  loadProductComments(productId: string): void {
    this.commentService.getCommentByProductId(productId).pipe(
      catchError((error) => {
        console.error('Ürün yorumları yüklenirken bir hata oluştu:', error);
        this.errorMessage = 'Ürün yorumları yüklenirken bir hata oluştu. Lütfen tekrar deneyin.';
        return of([]);
      })
    ).subscribe((productComments: UserComment[]) => {
      this.productComments = productComments;
    });
  }

  initializeForm(): void {
    this.commentAddForm = this.fb.group({
      nameSurname: ['', Validators.required],
      email: ['', Validators.required],
      imageUrl: [''],
      commentDetail: [''],
      rating: ['', [Validators.required, Validators.pattern('^[1-5]*$')]],
      createdDate: [new Date().toISOString(), Validators.required],
      productId: this.productId
    });
  }

  onSubmit(): void {
    if (this.commentAddForm.valid) {
      const newUserComment: UserComment = this.commentAddForm.value;
      this.commentService.addComment(newUserComment).pipe(
        catchError((error) => {
          console.error('Yorum eklenirken bir hata oluştu:', error);
          return of(null);
        })
      ).subscribe({
        next: () => {
          this.router.navigate(['home/product-detail/',this.productId]);
          this.commentAddForm.reset(); 
        },
        error: (error) => {
          console.error('Yorum eklenirken bir hata oluştu:', error);
        }
      });
    }
  }

 
  addToBasket(): void {
    this.catalogService.getProductById(this.productId!).pipe(
      catchError((error) => {
        console.error('Ürün yüklenirken bir hata oluştu:', error);
        this.errorMessage = 'Ürün yüklenirken bir hata oluştu. Lütfen tekrar deneyin.';
        return of(null); // Ürün yüklenemezse null döndür
      })
    ).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.basketProduct = response.data;
  
          this.basketItem = {
            productId: this.basketProduct.id, 
            productName: this.basketProduct.name,
            imageUrl:this.basketProduct.imageUrl,
            price: this.basketProduct.price ?? 0,
            quantity: 1
          };
  
          this.basketService.addBasketItem(this.basketItem!).pipe(
            catchError((error) => {
              console.error('Ürün sepete eklenirken hata oluştu:', error);
              this.errorMessage = 'Ürün sepete eklenirken bir hata oluştu. Lütfen tekrar deneyin.';
              return of(); // Sepete eklenemezse null döndür
            })
          ).subscribe({
            next: () => {        
               console.log('Ürün sepete eklendi.');
               this.toastr.success('Ürün sepete eklendi.', 'Başarılı');
            },
            error: (error) => {
              console.error('Sepet güncellenirken hata oluştu:', error);
              this.errorMessage = 'Sepet güncellenirken bir hata oluştu. Lütfen tekrar deneyin.';
            }
          });
  
        } else {
          this.errorMessage = 'Ürün bilgileri alınamadı.';
        }
      },
      error: (error) => {
        console.error('Ürün yüklenirken bir hata oluştu:', error);
        this.errorMessage = 'Ürün yüklenirken bir hata oluştu. Lütfen tekrar deneyin.';
      }
    });
  }
  
 
}
