import ProductsClient from "../../products/ProductsClient"; 

export default async function CategoryPage({ params }) {
  const { slug } = await params; 

  return (
    <ProductsClient initialCategory={slug} initialScope="tree" />
  );
}

