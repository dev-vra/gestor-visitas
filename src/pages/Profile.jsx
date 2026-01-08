import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import styles from "../styles/Users.module.css";
import { User, Lock, Save, Loader2 } from "lucide-react";

export default function Profile() {
  const { user, profile } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e) => {
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
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;

      alert("Senha alterada com sucesso!");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      alert("Erro ao alterar senha: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Meu Perfil</h1>

      <div className="flex gap-6 mt-6 flex-wrap">
        {/* Info Card */}
        <div className="glass-panel p-6 flex-1 min-w-[300px]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile?.full_name}</h2>
              <p className="text-gray-400 capitalize">{profile?.role}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase font-semibold">
                Email
              </label>
              <div className="text-white bg-white/5 p-3 rounded mt-1">
                {user?.email}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-semibold">
                ID do Sistema
              </label>
              <div className="text-gray-400 text-xs mt-1 font-mono">
                {user?.id}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="glass-panel p-6 flex-1 min-w-[300px]">
          <div className="flex items-center gap-3 mb-6">
            <Lock size={20} className="text-yellow-400" />
            <h3 className="text-lg font-semibold">Alterar Senha</h3>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Nova Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Confirmar Senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="Repita a senha"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Atualizar Senha
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
