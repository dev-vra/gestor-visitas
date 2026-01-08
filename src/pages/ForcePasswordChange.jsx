import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import styles from "../styles/Login.module.css"; // Reuse login styles
import { Lock, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ForcePasswordChange() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }
    if (password.length < 6) {
      alert("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      // 1. Update Password
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;

      // 2. Clear flag
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", user.id);

      if (profileError) throw profileError;

      alert("Senha alterada com sucesso!");
      navigate("/"); // Go to dashboard
      window.location.reload(); // Force reload to refresh context state if needed
    } catch (err) {
      console.error(err);
      alert("Erro ao alterar senha: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div
            className={styles.iconWrapper}
            style={{ backgroundColor: "#fbbf24" }}
          >
            <Lock size={32} color="white" />
          </div>
          <h1>Alteração Obrigatória</h1>
          <p>
            Por segurança, você precisa redefinir sua senha antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Nova Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Confirmar Nova Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Repita a senha"
            />
          </div>

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : "Redefinir Senha"}
          </button>

          <button
            type="button"
            className="text-gray-400 text-sm mt-4 hover:underline"
            onClick={() => signOut()}
          >
            Sair e fazer login com outra conta
          </button>
        </form>
      </div>
    </div>
  );
}
