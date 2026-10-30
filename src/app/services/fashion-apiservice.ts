import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, map, Observable, throwError } from "rxjs";
import { Fashion } from "../classes/Fashion";

@Injectable({ providedIn: "root" })
export class FashionAPIService {
  constructor(private http: HttpClient) {}
  getFashions(): Observable<Fashion[]> {
    return this.http.get<Fashion[]>("/fashions").pipe(
      map((items) => items.map((item) => Object.assign(new Fashion(), item))),
      catchError(this.handleError),
    );
  }
  getFashion(id: string): Observable<Fashion> {
    return this.http.get<Fashion>("/fashions/" + encodeURIComponent(id)).pipe(
      map((item) => Object.assign(new Fashion(), item)),
      catchError(this.handleError),
    );
  }
  getFashionBySlug(slug: string): Observable<Fashion> {
    return this.http
      .get<Fashion>("/fashions/slug/" + encodeURIComponent(slug))
      .pipe(
        map((item) => Object.assign(new Fashion(), item)),
        catchError(this.handleError),
      );
  }
  private handleError(error: HttpErrorResponse) {
    const message =
      error.status === 0
        ? "Chưa kết nối được máy chủ. Vui lòng kiểm tra Fashion API."
        : error.error?.message || "Không thể tải dữ liệu. Vui lòng thử lại.";
    return throwError(() => new Error(message));
  }
}
