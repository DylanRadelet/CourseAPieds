"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, LogIn } from "lucide-react";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoInput } from "@/components/ui/NeoInput";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Une erreur est survenue.");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
      <div className="neo-sm w-14 h-14 flex items-center justify-center text-cap-violet">
        <Lock size={26} strokeWidth={2.25} />
      </div>

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-cap-black">
          Connexion
        </h1>
        <p className="text-sm text-cap-muted mt-1">
          Entre le mot de passe pour accéder à ton suivi d&apos;entraînement.
        </p>
      </div>

      <NeoInput
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
        required
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <NeoButton
        type="submit"
        variant="violet"
        disabled={loading || !password}
        className="w-full"
      >
        <LogIn size={16} strokeWidth={2.25} />
        {loading ? "Connexion..." : "Se connecter"}
      </NeoButton>
    </form>
  );
}
