import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { provideHttpClient } from "@angular/common/http";
import { AppComponent } from "./app.component";
import { AppRoutingModule } from "./app-routing-module";
import { FashionComponent } from "./fashion-component/fashion-component";
import { FashionDetailComponent } from "./fashion-detail-component/fashion-detail-component";
import { SearchFashionComponent } from "./search-fashion-component/search-fashion-component";
@NgModule({
  declarations: [
    AppComponent,
    FashionComponent,
    FashionDetailComponent,
    SearchFashionComponent,
  ],
  imports: [BrowserModule, FormsModule, AppRoutingModule],
  providers: [provideHttpClient()],
  bootstrap: [AppComponent],
})
export class AppModule {}
