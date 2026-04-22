import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import styles from "../styles/Bairros.module.css";
import {
  Search,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  X,
  Save,
  MapPin,
  Building2,
  ChevronDown,
} from "lucide-react";

/* ─── Modal de Adicionar / Editar Bairro ────────────────────────────── */
function BairroModal({ bairro, cidades, onClose, onSaved }) {
  const isEditing = !!bairro;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: bairro?.name || "",
    city_id: bairro?.city_id || "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.city_id) {
      setError("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    try {
      if (isEditing) {
        const { error: err } = await supabase
          .from("Neighborhood")
          .update({ name: form.name.trim(), city_id: Number(form.city_id) })
          .eq("id", bairro.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from("Neighborhood")
          .insert({ name: form.name.trim(), city_id: Number(form.city_id) });
        if (err) throw err;
      }
      onSaved();
    } catch (err) {
      setError(err.message || "Erro ao salvar bairro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <div className={styles.modalIcon}>
              <MapPin size={20} />
            </div>
            <h2>{isEditing ? "Editar Bairro" : "Novo Bairro"}</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {error && <div className={styles.errorMsg}>{error}</div>}

          <div className={styles.fieldGroup}>
            <label>Cidade</label>
            <div className={styles.selectWrapper}>
              <select
                value={form.city_id}
                onChange={(e) =>
                  setForm((p) => ({ ...p, city_id: e.target.value }))
                }
                required
              >
                <option value="">Selecione a cidade...</option>
                {cidades.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className={styles.selectIcon} />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label>Nome do Bairro</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ex: Jardim Primavera"
              required
            />
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnCancel}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnSave}
              disabled={loading}
            >
              <Save size={16} />
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Modal de confirmação de exclusão ─────────────────────────────── */
function DeleteModal({ bairro, onConfirm, onClose, loading }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.modalSmall}`}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <div className={`${styles.modalIcon} ${styles.modalIconDanger}`}>
              <Trash2 size={20} />
            </div>
            <h2>Confirmar Exclusão</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <p>
            Tem certeza que deseja excluir o bairro{" "}
            <strong>"{bairro.nome}"</strong>?
          </p>
          <p className={styles.warnText}>
            Esta ação não pode ser desfeita. Visitas vinculadas a este bairro
            manterão o nome salvo, mas não aparecerão mais no dropdown.
          </p>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnCancel}>
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={styles.btnDanger}
            disabled={loading}
          >
            <Trash2 size={16} />
            {loading ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Página Principal ──────────────────────────────────────────────── */
export default function Bairros() {
  const { profile } = useAuth();
  const [cidades, setCidades] = useState([]);
  const [bairros, setBairros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cidadeFiltro, setCidadeFiltro] = useState("");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBairro, setSelectedBairro] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCidades();
    fetchBairros();
  }, []);

  const fetchCidades = async () => {
    const { data, error } = await supabase
      .from("City")
      .select("id, name")
      .order("name");
    if (error) console.error("fetchCidades error:", error);
    setCidades(data || []);
  };

  const fetchBairros = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("Neighborhood")
      .select("id, name, city_id, City(name)")
      .order("name");
    if (error) console.error("fetchBairros error:", error);
    setBairros(data || []);
    setLoading(false);
  };

  const handleNew = () => {
    setSelectedBairro(null);
    setModalOpen(true);
  };

  const handleEdit = (b) => {
    setSelectedBairro(b);
    setModalOpen(true);
  };

  const handleSaved = () => {
    setModalOpen(false);
    setSelectedBairro(null);
    fetchBairros();
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("Neighborhood")
        .delete()
        .eq("id", deleteModal.id);
      if (error) throw error;
      setDeleteModal(null);
      fetchBairros();
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Filtros
  const filtered = bairros.filter((b) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      b.name.toLowerCase().includes(term) ||
      b.City?.name?.toLowerCase().includes(term);
    const matchCidade = cidadeFiltro
      ? b.city_id === Number(cidadeFiltro)
      : true;
    return matchSearch && matchCidade;
  });

  // Agrupado por cidade para exibição
  const grouped = filtered.reduce((acc, b) => {
    const key = b.city_id;
    if (!acc[key]) acc[key] = { cidade: b.City?.name || "—", items: [] };
    acc[key].items.push(b);
    return acc;
  }, {});

  if (profile?.role !== "gestor") {
    return (
      <div className={styles.restricted}>
        <MapPin size={40} />
        <p>Acesso Restrito — apenas Gestores podem gerenciar bairros.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Bairros</h1>
          <p className={styles.subtitle}>
            Gerencie os bairros disponíveis no formulário de visitas
          </p>
        </div>
        <button onClick={handleNew} className={styles.btnPrimary}>
          <Plus size={18} />
          Novo Bairro
        </button>
      </div>

      {/* Filtros */}
      <div className={`glass-panel ${styles.filters}`}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar bairro ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.selectWrapper}>
          <Building2 size={16} className={styles.filterIcon} />
          <select
            value={cidadeFiltro}
            onChange={(e) => setCidadeFiltro(e.target.value)}
            className={styles.cidadeFilter}
          >
            <option value="">
                Todas as cidades
              </option>
              {cidades.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <ChevronDown size={14} className={styles.selectChevron} />
        </div>
        <div className={styles.countBadge}>
          {filtered.length} bairro{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className={styles.loadingState}>
          <Loader2 className={styles.spinner} size={32} />
          <p>Carregando bairros...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <MapPin size={48} className={styles.emptyIcon} />
          <p>Nenhum bairro encontrado.</p>
          <button onClick={handleNew} className={styles.btnPrimary}>
            <Plus size={16} />
            Adicionar Bairro
          </button>
        </div>
      ) : (
        <div className={styles.groups}>
          {Object.values(grouped).map((group) => (
            <div
              key={group.cidade}
              className={`glass-panel ${styles.groupCard}`}
            >
              <div className={styles.groupHeader}>
                <Building2 size={16} className={styles.groupIcon} />
                <span className={styles.groupTitle}>{group.cidade}</span>
                <span className={styles.groupCount}>{group.items.length}</span>
              </div>
              <div className={styles.bairroList}>
                {group.items.map((b) => (
                  <div key={b.id} className={styles.bairroRow}>
                    <div className={styles.bairroInfo}>
                      <MapPin size={14} className={styles.bairroPin} />
                      <span className={styles.bairroNome}>{b.name}</span>
                    </div>
                    <div className={styles.rowActions}>
                      <button
                        onClick={() => handleEdit(b)}
                        className={styles.editBtn}
                        title="Editar"
                      >
                        <Pencil size={15} />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => setDeleteModal(b)}
                        className={styles.deleteBtn}
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <BairroModal
          bairro={selectedBairro}
          cidades={cidades}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
      {deleteModal && (
        <DeleteModal
          bairro={deleteModal}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteModal(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
