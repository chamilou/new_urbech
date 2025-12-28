export async function generateMetadata({ searchParams }) {
  const category = searchParams?.category;

  const canonical = category
    ? `/category${encodeURIComponent(category)}`
    : "/products";

  return {
    alternates: {
      canonical,
    },
  };
}

export default function Layout({ children }) {
  return children;
}
