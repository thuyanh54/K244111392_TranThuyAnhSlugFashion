import { Component } from "@angular/core";
@Component({
  selector: "app-root",
  standalone: false,
  template: `
    <div class="shell">
      <header class="site-header">
        <a
          class="wordmark"
          routerLink="/fashion-list"
          aria-label="ELIAN — Trang chủ"
          ><span class="logo-pill">ELIAN</span></a
        >
        <nav class="site-nav" aria-label="Điều hướng chính">
          <a routerLink="/fashion-list" routerLinkActive="active">Bộ sưu tập</a>
          <a routerLink="/search-fashion" routerLinkActive="active"
            >Tìm cảm hứng</a
          >
          <a routerLink="/fashion-detail" routerLinkActive="active"
            >Tra cứu thiết kế ↗</a
          >
        </nav>
      </header>
      <router-outlet></router-outlet>
      <footer class="site-footer">
        <span>ELIAN / TIMELESS DESIGN ARCHIVE</span
        ><span>Transform your style with ELIAN's timeless collection.</span>
      </footer>
    </div>
  `,
})
export class AppComponent {}
