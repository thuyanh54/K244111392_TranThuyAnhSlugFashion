import { Component, DestroyRef, computed, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Fashion } from "../classes/Fashion";
import { FashionAPIService } from "../services/fashion-apiservice";

@Component({
  selector: "app-fashion-component",
  standalone: false,
  templateUrl: "./fashion-component.html",
  styleUrl: "./fashion-component.css",
})
export class FashionComponent {
  private service = inject(FashionAPIService);
  private destroyRef = inject(DestroyRef);
  fashions = signal<Fashion[]>([]);
  errMessage = signal("");
  isLoading = signal(true);
  selectedStyle = signal("");
  styles = computed(() =>
    [
      ...new Set(
        this.fashions()
          .map((item) => item.style)
          .filter(Boolean),
      ),
    ].sort(),
  );
  visibleFashions = computed(() =>
    this.fashions().filter(
      (item) => !this.selectedStyle() || item.style === this.selectedStyle(),
    ),
  );
  featuredFashions = computed(() => this.fashions().slice(0, 3));
  constructor() {
    this.loadFashions();
  }
  loadFashions(): void {
    this.errMessage.set("");
    this.isLoading.set(true);
    this.service
      .getFashions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.fashions.set(data);
          this.isLoading.set(false);
        },
        error: (error: Error) => {
          this.errMessage.set(error.message);
          this.isLoading.set(false);
        },
      });
  }
  hideBrokenImage(event: Event): void {
    (event.target as HTMLImageElement).hidden = true;
  }
}
