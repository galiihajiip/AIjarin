export default function MisiPlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">{children}</div>
  );
}
