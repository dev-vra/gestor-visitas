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
    nome: bairro?.nome || "",
    cidade_id: bairro?.cidade_id || "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.nome.trim() || !form.cidade_id) {
      setError("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    try {
      if (isEditing) {
        const { error: err } = await supabase
          .from("bairros")
          .update({ nome: form.nome.trim(), cidade_id: Number(form.cidade_id) })
          .eq("id", bairro.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from("bairros")
          .insert({ nome: form.nome.trim(), cidade_id: Number(form.cidade_id) });
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
                value={form.cidade_id}
                onChange={(e) =>
                  setForm((p) => ({ ...p, cidade_id: e.target.value }))
                }
                required
              >
                <option value="">Selecione a cidade...</option>
                {cidades.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
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
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
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

/* ─── Modal de Adicionar / Editar Cidade ────────────────────────────── */
function CidadeModal({ cidade, onClose, onSaved }) {
  const isEditing = !!cidade;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: cidade?.nome || "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.nome.trim()) {
      setError("Preencha o nome da cidade.");
      return;
    }
    setLoading(true);
    try {
      if (isEditing) {
        const { error: err } = await supabase
          .from("cidades")
          .update({ nome: form.nome.trim() })
          .eq("id", cidade.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from("cidades")
          .insert({ nome: form.nome.trim() });
        if (err) throw err;
      }
      onSaved();
    } catch (err) {
      setError(err.message || "Erro ao salvar cidade.");
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
              <Building2 size={20} />
            </div>
            <h2>{isEditing ? "Editar Cidade" : "Nova Cidade"}</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {error && <div className={styles.errorMsg}>{error}</div>}

          <div className={styles.fieldGroup}>
            <label>Nome da Cidade</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              placeholder="Ex: Cuiabá"
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
            <h2>Confirmar Exclusão de {bairro.isCity ? "Cidade" : "Bairro"}</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <p>
            Tem certeza que deseja excluir a localidade{" "}
            <strong>"{bairro.nome}"</strong>?
          </p>
          {bairro.isCity && (
            <p className={styles.warnText} style={{ color: '#ef4444', marginTop: '10px' }}>
              Atenção: Todos os bairros associados a esta cidade também serão excluídos!
            </p>
          )}
          <p className={styles.warnText} style={{ marginTop: '10px' }}>
            Esta ação não pode ser desfeita. Visitas vinculadas manterão o nome salvo, 
            mas a localidade não aparecerá mais no dropdown.
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
  const [cidadeModalOpen, setCidadeModalOpen] = useState(false);
  const [selectedBairro, setSelectedBairro] = useState(null);
  const [selectedCidade, setSelectedCidade] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCidades();
    fetchBairros();
  }, []);

  const fetchCidades = async () => {
    const { data, error } = await supabase
      .from("cidades")
      .select("id, nome")
      .order("nome");
    if (error) console.error("fetchCidades error:", error);
    setCidades(data || []);
  };

  const fetchBairros = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bairros")
      .select("id, nome, cidade_id, cidades(nome)")
      .order("nome");
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

  const handleNewCity = () => {
    setSelectedCidade(null);
    setCidadeModalOpen(true);
  };

  const handleEditCity = (c) => {
    setSelectedCidade(c);
    setCidadeModalOpen(true);
  };

  const handleSavedCity = () => {
    setCidadeModalOpen(false);
    setSelectedCidade(null);
    fetchCidades();
    // Also re-fetch bairros just in case names updated and we need fresh view
    fetchBairros();
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      if (deleteModal.isCity) {
        const { error } = await supabase
          .from("cidades")
          .delete()
          .eq("id", deleteModal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bairros")
          .delete()
          .eq("id", deleteModal.id);
        if (error) throw error;
      }
      setDeleteModal(null);
      fetchCidades();
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
      b.nome.toLowerCase().includes(term) ||
      b.cidades?.nome?.toLowerCase().includes(term);
    const matchCidade = cidadeFiltro
      ? b.cidade_id === Number(cidadeFiltro)
      : true;
    return matchSearch && matchCidade;
  });

  // Agrupado por cidade para exibição
  const grouped = filtered.reduce((acc, b) => {
    const key = b.cidade_id;
    if (!acc[key]) acc[key] = { id: b.cidade_id, cidade: b.cidades?.nome || "—", items: [] };
    acc[key].items.push(b);
    return acc;
  }, {});

  // Add cities with no neighborhoods to the grouped list if no filters are applied
  if (!searchTerm && (!cidadeFiltro)) {
    cidades.forEach(c => {
      if (!grouped[c.id]) {
        grouped[c.id] = { id: c.id, cidade: c.nome, items: [] };
      }
    });
  }

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
            Gerencie as cidades e bairros disponíveis no sistema
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleNewCity} className={styles.btnSecondary} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem' }}>
            <Building2 size={18} />
            Nova Cidade
          </button>
          <button onClick={handleNew} className={styles.btnPrimary}>
            <Plus size={18} />
            Novo Bairro
          </button>
        </div>
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
                  {c.nome}
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
      ) : Object.keys(grouped).length === 0 ? (
        <div className={styles.emptyState}>
          <MapPin size={48} className={styles.emptyIcon} />
          <p>Nenhuma localidade encontrada.</p>
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
                <div style={{flexGrow: 1}}></div>
                <button
                  onClick={() => handleEditCity({ id: group.id, nome: group.cidade })}
                  className={styles.editBtn}
                  title="Editar Cidade"
                  style={{ marginRight: '0.5rem' }}
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeleteModal({ id: group.id, nome: group.cidade, isCity: true })}
                  className={styles.deleteBtn}
                  title="Excluir Cidade"
                  style={{ opacity: 1 }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className={styles.bairroList}>
                {group.items.length === 0 && (
                  <p className="text-gray-400 text-sm py-2 px-3 italic">Sem bairros cadastrados</p>
                )}
                {group.items.map((b) => (
                  <div key={b.id} className={styles.bairroRow}>
                    <div className={styles.bairroInfo}>
                      <MapPin size={14} className={styles.bairroPin} />
                      <span className={styles.bairroNome}>{b.nome}</span>
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
      {cidadeModalOpen && (
        <CidadeModal
          cidade={selectedCidade}
          onClose={() => setCidadeModalOpen(false)}
          onSaved={handleSavedCity}
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
