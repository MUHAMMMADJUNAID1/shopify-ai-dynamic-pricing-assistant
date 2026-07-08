import { requireEnv, env } from "@/server/env";
import type { ShopifyProductForPricing } from "@/server/pricing/types";

const MOCK_PRODUCTS: ShopifyProductForPricing[] = [
  {
    productId: "gid://shopify/Product/mock-premium-hoodie",
    variantId: "gid://shopify/ProductVariant/mock-premium-hoodie",
    title: "Premium Hoodie",
    productType: "Apparel",
    vendor: "MG Test",
    currentPrice: 100,
    inventoryQuantity: 10,
  },
  {
    productId: "gid://shopify/Product/mock-basic-t-shirt",
    variantId: "gid://shopify/ProductVariant/mock-basic-t-shirt",
    title: "Basic T-Shirt",
    productType: "Apparel",
    vendor: "MG Test",
    currentPrice: 25,
    inventoryQuantity: 80,
  },
  {
    productId: "gid://shopify/Product/mock-leather-bag",
    variantId: "gid://shopify/ProductVariant/mock-leather-bag",
    title: "Leather Bag",
    productType: "Accessories",
    vendor: "MG Test",
    currentPrice: 120,
    inventoryQuantity: 5,
  },
];

type ShopifyGraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type ProductsQueryResponse = {
  products: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        productType: string | null;
        vendor: string | null;
        variants: {
          edges: Array<{
            node: {
              id: string;
              price: string;
              inventoryQuantity: number | null;
            };
          }>;
        };
      };
    }>;
  };
};

type ProductVariantsBulkUpdateResponse = {
  productVariantsBulkUpdate: {
    productVariants: Array<{
      id: string;
      price: string;
    }>;
    userErrors: Array<{
      field: string[] | null;
      message: string;
    }>;
  };
};

async function shopifyGraphql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const shopDomain = requireEnv("SHOPIFY_SHOP_DOMAIN").replace(/^https?:\/\//, "");
  const token = requireEnv("SHOPIFY_ACCESS_TOKEN");
  const url = `https://${shopDomain}/admin/api/${env.SHOPIFY_API_VERSION}/graphql.json`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Shopify request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as ShopifyGraphqlResponse<T>;

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  if (!payload.data) {
    throw new Error("Shopify response did not include data.");
  }

  return payload.data;
}

export async function fetchProductsForPricing(
  limit = 25,
): Promise<ShopifyProductForPricing[]> {
  if (env.MOCK_SHOPIFY === "true") {
    return MOCK_PRODUCTS.slice(0, limit);
  }

  const data = await shopifyGraphql<ProductsQueryResponse>(
    `#graphql
      query ProductsForPricing($first: Int!) {
        products(first: $first, sortKey: UPDATED_AT, reverse: true) {
          edges {
            node {
              id
              title
              productType
              vendor
              variants(first: 1) {
                edges {
                  node {
                    id
                    price
                    inventoryQuantity
                  }
                }
              }
            }
          }
        }
      }
    `,
    { first: limit },
  );

  return data.products.edges.flatMap(({ node }) => {
    const variant = node.variants.edges[0]?.node;
    const currentPrice = Number(variant?.price);

    if (!variant || !Number.isFinite(currentPrice)) {
      return [];
    }

    return [
      {
        productId: node.id,
        variantId: variant.id,
        title: node.title,
        productType: node.productType,
        vendor: node.vendor,
        currentPrice,
        inventoryQuantity: variant.inventoryQuantity ?? 0,
      },
    ];
  });
}

export async function updateVariantPrice(input: {
  productId: string;
  variantId: string;
  price: number;
}) {
  if (env.MOCK_SHOPIFY === "true") {
    return {
      id: input.variantId,
      price: input.price.toFixed(2),
    };
  }

  const data = await shopifyGraphql<ProductVariantsBulkUpdateResponse>(
    `#graphql
      mutation UpdateVariantPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          productVariants {
            id
            price
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      productId: input.productId,
      variants: [
        {
          id: input.variantId,
          price: input.price.toFixed(2),
        },
      ],
    },
  );

  const errors = data.productVariantsBulkUpdate.userErrors;

  if (errors.length) {
    throw new Error(errors.map((error) => error.message).join("; "));
  }

  return data.productVariantsBulkUpdate.productVariants[0] ?? null;
}
