import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="neo p-8 w-full max-w-sm flex flex-col items-start">
        <LoginForm />
      </div>
    </main>
  );
}
