import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import styles from "../styles/Users.module.css";
import { Search, Plus, Loader2, UserCog } from "lucide-react";
import UserModal from "../components/UserModal";
import { format } from "date-fns";

export default function Users() {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    // Fetch profiles. Assuming profiles is the main source of user data we care about.
    // Note: We cannot list auth.users from client client, only public.profiles.
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true });

    if (error) console.error(error);
    else setUsers(data || []);
    setLoading(false);
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    );
  });

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    fetchUsers(); // Refresh list
  };

  // Only Gestor should access, but route protection handles that mostly.
  if (profile?.role !== "gestor") {
    return <div className="p-8 text-center text-gray-400">Acesso Restrito</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Usuários</h1>
          <p className={styles.subtitle}>
            Gerencie acesso e permissões do sistema
          </p>
        </div>
        <div className={styles.actions}>
          <button
            onClick={handleNew}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <Plus size={18} />
            Novo Usuário
          </button>
        </div>
      </div>

      <div className={`glass-panel ${styles.filters}`}>
        <div className={styles.searchBox}>
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por Nome, Email ou Cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={`glass-panel ${styles.tableContainer}`}>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Cargo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="font-medium">{u.full_name}</div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={styles.roleBadge} data-role={u.role}>
                      {u.role ? u.role.toUpperCase() : "SEM CARGO"}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: u.is_active === false ? "#f97316" : "#22c55e",
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background:
                            u.is_active === false ? "#f97316" : "#22c55e",
                        }}
                      />
                      {u.is_active === false ? "Desabilitado" : "Ativo"}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleEdit(u)}
                      className={styles.linkBtn}
                    >
                      <UserCog size={16} /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <UserModal userToEdit={selectedUser} onClose={handleModalClose} />
      )}
    </div>
  );
}
