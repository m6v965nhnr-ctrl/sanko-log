import ClassDetailClient from "./ClassDetailClient";

export const instant = false;

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClassDetailClient id={id} />;
}
