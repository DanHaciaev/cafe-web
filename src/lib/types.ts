export type Category = {
  id: number;
  name: string;
  imageUrl: string | null;
  slug: string;
  sortOrder: number;
};

export type Product = {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: number;
  isActive: boolean;
  sortOrder: number;
};

export type CartItemModifier = {
  groupName: string;
  optionName: string;
  priceDelta: number;
};

export type CartItemIngredientChange = {
  ingredientName: string;
  action: "removed" | "added";
  priceDelta: number;
};

export type CartItem = {
  cartId: string;
  productId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  modifiers: CartItemModifier[];
  ingredientChanges: CartItemIngredientChange[];
  note?: string;
};
