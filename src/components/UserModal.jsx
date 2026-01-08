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
              must_change_password: true,
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
                  type="text"
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
          </div>

          <div
            className={styles.footer}
            style={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <div>
              {isEditing && !showDeleteConfirm && (
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
                    onClick={async () => {
                      if (
                        !confirm(
                          "Deseja enviar um email de redefinição de senha para este usuário?"
                        )
                      )
                        return;
                      setLoading(true);
                      try {
                        const { error } =
                          await supabase.auth.resetPasswordForEmail(
                            formData.email,
                            {
                              redirectTo:
                                window.location.origin + "/update-password",
                            }
                          );
                        if (error) throw error;

                        await supabase
                          .from("profiles")
                          .update({ must_change_password: true })
                          .eq("id", userToEdit.id);

                        alert("Email de redefinição enviado com sucesso!");
                      } catch (err) {
                        alert("Erro ao enviar email: " + err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className={styles.cancelBtn}
                    style={{
                      color: "#fbbf24",
                      borderColor: "#fbbf24",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Lock size={16} /> Resetar Senha
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelBtn}
              >
                Cancelar
              </button>
              {!showDeleteConfirm ? (
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={loading}
                >
                  <Save size={18} /> {loading ? "Salvando..." : "Salvar"}
                </button>
              ) : (
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
                    Confirmar
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
