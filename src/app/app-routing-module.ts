import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { FashionComponent } from "./fashion-component/fashion-component";
import { FashionDetailComponent } from "./fashion-detail-component/fashion-detail-component";
import { SearchFashionComponent } from "./search-fashion-component/search-fashion-component";

const routes: Routes = [
  { path: "", redirectTo: "fashion-list", pathMatch: "full" },
  {
    path: "fashion-list",
    component: FashionComponent,
    title: "Bộ sưu tập | ELIAN",
  },
  {
    path: "fashion-detail",
    component: FashionDetailComponent,
    title: "Tra cứu | ELIAN",
  },
  {
    path: "fashion-detail/:slug",
    component: FashionDetailComponent,
    title: "Chi tiết | ELIAN",
  },
  {
    path: "search-fashion",
    component: SearchFashionComponent,
    title: "Tìm kiếm | ELIAN",
  },
  { path: "**", redirectTo: "fashion-list" },
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { scrollPositionRestoration: "enabled" }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
