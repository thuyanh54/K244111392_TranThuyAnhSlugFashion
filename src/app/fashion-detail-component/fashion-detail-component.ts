import { Component, DestroyRef, inject, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  catchError,
  combineLatest,
  map,
  of,
  startWith,
  Subject,
  switchMap,
} from "rxjs";
import { Fashion } from "../classes/Fashion";
import { FashionAPIService } from "../services/fashion-apiservice";

@Component({
  selector: "app-fashion-detail-component",
  standalone: false,
  templateUrl: "./fashion-detail-component.html",
  styleUrl: "./fashion-detail-component.css",
})
export class FashionDetailComponent {
  private service = inject(FashionAPIService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private retryLookup = new Subject<void>();
  fashion = signal<Fashion | null>(null);
  errMessage = signal("");
  isLoading = signal(false);
  imageFailed = signal(false);
  slug = "";
  constructor() {
    combineLatest([
      this.route.paramMap.pipe(map((params) => params.get("slug") || "")),
      this.retryLookup.pipe(startWith(undefined)),
    ])
      .pipe(
        map(([slug]) => slug),
        switchMap((slug) => {
          this.slug = slug;
          this.fashion.set(null);
          this.errMessage.set("");
          this.imageFailed.set(false);
          this.isLoading.set(Boolean(slug));
          if (!slug) return of(null);
          // switchMap cancels an older request when the selected slug changes.
          return this.service.getFashionBySlug(slug).pipe(
            catchError((error: Error) => {
              this.errMessage.set(error.message);
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((item) => {
        this.fashion.set(item);
        this.isLoading.set(false);
      });
  }
  searchFashion(): void {
    const slug = this.slug.trim();
    if (!slug) {
      this.errMessage.set("Vui lòng nhập slug của mẫu thời trang.");
      return;
    }
    if (slug === this.route.snapshot.paramMap.get("slug")) {
      this.retryLookup.next();
      return;
    }
    void this.router.navigate(["/fashion-detail", slug]);
  }
}
