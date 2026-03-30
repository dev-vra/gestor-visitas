import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "../contexts/AuthContext";
import styles from "../styles/VisitModal.module.css"; // Reuse modal styles
import { X, Save, Lock } from "lucide-react";

export default function UserModal({ userToEdit, onClose }) {
  const isEditing = !!userToEdit;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "", // Only for creation
    full_name: "",
    role: "agente",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAdminSetPassword, setShowAdminSetPassword] = useState(false);
  const [adminSetPassword, setAdminSetPassword] = useState("");
  const [confirmAdminSetPassword, setConfirmAdminSetPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const { user, profile } = useAuth(); // Current logged in admin

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        email: userToEdit.email || "",
        password: "",
        full_name: userToEdit.full_name || "",
        role: userToEdit.role || "agente",
      });
    }
  }, [userToEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        // Update Profile
        console.log("Updating profile...", userToEdit.id);
        const { data, error } = await supabase
          .from("profiles")
          .update({
            full_name: formData.full_name,
            role: formData.role,
          })
          .eq("id", userToEdit.id)
          .select();

        if (error) throw error;
        if (!data || data.length === 0)
          throw new Error(
            `Não foi possível atualizar. Verifique se você é Gestor. (Seu cargo: ${profile?.role})`
          );
      } else {
        // Create User
        // ... code ...
        if (!formData.password) {
          alert("Senha é obrigatória para novos usuários.");
          return;
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const tempClient = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        });

        const { data, error: signUpError } = await tempClient.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
              role: formData.role,
            },
          },
        });

        if (signUpError) throw signUpError;

        // Check for Email Enumeration Protection (User already exists)
        if (
          data?.user &&
          data.user.identities &&
          data.user.identities.length === 0
        ) {
          throw new Error(
            "Este email já está cadastrado no sistema (Autenticação). Por favor, apague o usuário no Painel do Supabase ou use outro email."
          );
        }

        if (data?.user) {
          // Force upsert profile to ensure it exists
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              id: data.user.id,
              full_name: formData.full_name,
              role: formData.role,
              email: formData.email,
            });

          if (profileError) {
            console.error("Error creating/updating profile:", profileError);
            throw new Error(
              "Erro ao criar perfil no banco de dados: " + profileError.message
            );
          }

          alert("Usuário criado com sucesso!");
        }
      }

      onClose();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!adminPassword) {
      alert("Por favor, informe sua senha para confirmar.");
      return;
    }
    setLoading(true);
    try {
      console.log("Attempting delete with role:", profile?.role);

      // 1. Re-authenticate admin to confirm identity
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: adminPassword,
      });

      if (authError)
        throw new Error("Senha incorreta. Exclusão não permitida.");

      // 2. Delete Profile
      const { data, error: deleteError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userToEdit.id)
        .select();

      if (deleteError) throw deleteError;
      if (!data || data.length === 0)
        throw new Error(
          `Não foi possível excluir. Verifique se as permissões (RLS) foram aplicadas no Supabase. (Seu cargo: ${profile?.role})`
        );

      alert("Usuário excluído com sucesso.");
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminUpdatePassword = async () => {
    if (adminSetPassword !== confirmAdminSetPassword) {
      alert("As senhas não coincidem!");
      return;
    }
    if (adminSetPassword.length < 6) {
      alert("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_update_user_password", {
        target_user_id: userToEdit.id,
        new_password: adminSetPassword,
      });

      if (error) throw error;

      alert("Senha alterada com sucesso!");
      setShowAdminSetPassword(false);
      setAdminSetPassword("");
      setConfirmAdminSetPassword("");
    } catch (err) {
      console.error(err);
      alert("Erro ao alterar senha: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div
        className={`${styles.modal} glass-panel`}
        style={{ maxWidth: "500px" }}
      >
        <div className={styles.header}>
          <h2>{isEditing ? "Editar Usuário" : "Novo Usuário"}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.content}>
          <div className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Nome Completo</label>
              <input
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Email</label>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isEditing}
              />
            </div>

            {!isEditing && (
              <div className={styles.inputGroup}>
                <label>Senha Provisória</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            )}

            <div className={styles.inputGroup}>
              <label>Cargo (Perfil)</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="agente">Agente de Campo</option>
                <option value="consultor">Consultor</option>
                <option value="gestor">Gestor</option>
              </select>
            </div>

            {isEditing && showAdminSetPassword && (
              <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-yellow-500">
                  <Lock size={14} /> Definir Nova Senha
                </h4>
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Nova Senha"
                    value={adminSetPassword}
                    onChange={(e) => setAdminSetPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm focus:outline-none focus:border-yellow-500"
                  />
                  <input
                    type="password"
                    placeholder="Confirmar Nova Senha"
                    value={confirmAdminSetPassword}
                    onChange={(e) => setConfirmAdminSetPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm focus:outline-none focus:border-yellow-500"
                  />
                  <div className="flex gap-2 justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => setShowAdminSetPassword(false)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAdminUpdatePassword}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold py-1 px-3 rounded transition-colors"
                      disabled={loading || !adminSetPassword}
                    >
                      {loading ? "Alterando..." : "Confirmar Troca"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className={styles.footer}
            style={{ justifyContent: "space-between", alignItems: "center", gap: "1rem" }}
          >
            <div>
              {isEditing && !showDeleteConfirm && !showAdminSetPassword && (
                <div
                  style={{ display: "flex", gap: "1rem", alignItems: "center" }}
                >
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                      padding: "0",
                    }}
                  >
                    Excluir
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdminSetPassword(true)}
                    className={styles.cancelBtn}
                    style={{
                      color: "#fbbf24",
                      borderColor: "#fbbf24",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Lock size={16} /> Alterar Senha
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelBtn}
              >
                Fechar
              </button>
              
              {!showDeleteConfirm && (
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={loading}
                >
                  <Save size={18} /> {loading ? "Salvando..." : "Salvar Alterações"}
                </button>
              )}

              {showDeleteConfirm && (
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="password"
                    placeholder="Sua senha..."
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className={styles.passwordParam}
                    style={{
                      padding: "0.75rem",
                      fontSize: "0.875rem",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid #334155",
                      borderRadius: "0.375rem",
                      color: "white",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleDelete}
                    className={styles.saveBtn}
                    style={{ backgroundColor: "#ef4444" }}
                    disabled={loading || !adminPassword}
                  >
                    Confirmar Exclusão
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-xs text-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
