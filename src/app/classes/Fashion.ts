export class Fashion {
  constructor(
    public _id: string = "",
    public IdF: number = 0,
    public slug: string = "",
    public style: string = "",
    public fashion_subject: string = "",
    public fashion_detail: string = "",
    public fashion_image: string = "",
  ) {}
  get Base64String(): string {
    const image =
      typeof this.fashion_image === "string" ? this.fashion_image.trim() : "";
    if (!image) return "";
    if (/^(data:image\/|https?:\/\/|\/assets\/)/i.test(image)) return image;
    return "data:image/png;base64," + image;
  }
}
