import { GoogleLoginButton } from '@/components/auth/google-login-button';

export default function LoginPage() {
  return (
    <main className="login-shell flex min-h-dvh items-center justify-center px-6 py-10">
      <section className="login-panel w-full max-w-sm rounded-[24px] border border-border p-6 sm:p-7">
        <h1 className="mb-1 text-3xl font-bold text-primary">Watchly</h1>
        <p className="mb-6 text-muted">Accedi con Google per vedere il tuo calendario.</p>
        <GoogleLoginButton />
        <p className="mt-5 text-xs leading-5 text-muted">
          Al primo accesso verrà creato il tuo profilo Watchly. Google non viene usato per accedere ai dati delle tue serie.
        </p>
      </section>
    </main>
  );
}
