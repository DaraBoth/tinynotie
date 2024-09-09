export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout">
      <main className="auth-content">{children}</main>
    </div>
  );
}
