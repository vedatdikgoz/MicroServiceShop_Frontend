import { Component, OnInit } from '@angular/core';
import { CatalogService } from '../../../services/catalog.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Category } from '../../../models/catalog/category';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'category-add',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './category-add.component.html',
  styleUrl: './category-add.component.css'
})

export class CategoryAddComponent implements OnInit {
  categoryAddForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private catalogService: CatalogService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.categoryAddForm = this.fb.group({
      name: ['', Validators.required],
      imageUrl: [''] 
    });
  }

  onSubmit(): void {
    if (this.categoryAddForm.valid) {
      const newCategory: Category = this.categoryAddForm.value;

      this.catalogService.addCategory(newCategory).pipe(
        catchError((error) => {
          console.error('Kategori eklenirken bir hata oluştu:', error);
          return of(null);
        })
      ).subscribe({
        next: () => {
          this.router.navigate(['/admin']);
        },
        error: (error) => {
          console.error('Kategori eklenirken bir hata oluştu:', error);
        }
      });
    }
  }
}
