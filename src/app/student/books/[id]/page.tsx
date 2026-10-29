import BookDetailClient from "./BookDetailClient";

export const instant = false;

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookDetailClient id={id} />;
}
