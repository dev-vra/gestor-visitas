import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import styles from "../styles/VistoriaModal.module.css";
import { X, Save, Clock, MessageSquare, FileText, Send, MapPin } from "lucide-react";
import LocationLink from "./LocationLink";
import cidadesData from "../data/cidades.json";
import bairrosData from "../data/bairros.json";
import { format } from "date-fns";

export default function VistoriaModal({ visit, onClose }) {
  const { profile, user } = useAuth(); // Logged user
  const isEditing = !!visit;
  const isOldTask = visit?.created_at && new Date(visit.created_at) < new Date("2026-04-01");

  // Tabs: details, observations, history
  const [activeTab, setActiveTab] = useState("details");

  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState([]);

  // Audit & Obs Data
  const [history, setHistory] = useState([]);
  const [observations, setObservations] = useState([]);
  const [newObservation, setNewObservation] = useState("");

  // Form Data
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    phone1: "",
    phone2: "",
    city: "",
    neighborhood: "",
    address_block: "",
    address_lot: "",
    address_street: "",
    address_number: "",
    location_url: "",
    date_predicted: "",
    date_effective: "",
    agent_id: "",
    status: "Agendar Vistoria",
    observations: "", // Legacy/Main obs
  });

  const availableNeighborhoods = formData.city
    ? bairrosData.data.filter(
        (b) =>
          b.cidade_id ===
          cidadesData.data.find((c) => c.nome === formData.city)?.id
      )
    : [];

  // Permissions (Role Based)
  const isAgent = profile?.role === "agente";
  const canEditDetails = !isAgent; // Agent cannot edit name, address, etc.
  const canEditStatus = true; // Everyone can edit status/dates (Agent mainly)

  useEffect(() => {
    fetchAgents();
    if (visit) {
      setFormData({
        name: visit.name || "",
        cpf: visit.cpf || "",
        phone1: visit.phone1 || "",
        phone2: visit.phone2 || "",
        city: visit.city || "",
        neighborhood: visit.neighborhood || "",
        address_block: visit.address_block || "",
        address_lot: visit.address_lot || "",
        address_street: visit.address_street || "",
        address_number: visit.address_number || "",
        location_url: visit.location_url || "",
        date_predicted: formatDateToDisplay(visit.date_predicted),
        date_effective: formatDateToDisplay(visit.date_effective),
        agent_id: visit.agent_id || "",
        status: visit.status || "Agendar Vistoria",
        observations: visit.observations || "",
      });
      fetchHistory(visit.id);
      fetchObservations(visit.id);
    }
  }, [visit]);

  const fetchAgents = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .neq("role", "consultor"); // Assuming consultants are not agents
    setAgents(data || []);
  };

  const fetchHistory = async (visitId) => {
    const { data } = await supabase
      .from("visit_history")
      .select("*, profiles(full_name)")
      .eq("visit_id", visitId)
      .order("created_at", { ascending: false });
    setHistory(data || []);
  };

  const fetchObservations = async (visitId) => {
    const { data } = await supabase
      .from("visit_observations")
      .select("*, profiles(full_name)")
      .eq("visit_id", visitId)
      .order("created_at", { ascending: false });
    setObservations(data || []);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneMask = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11); // Max 11 digits (DDD + 9 digits)

    // (XX) XXXXX-XXXX
    if (value.length > 2) value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    if (value.length > 9) value = `${value.slice(0, 10)}-${value.slice(10)}`;

    setFormData((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const handleCpfMask = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Only numbers
    if (value.length > 11) value = value.slice(0, 11); // Max 11 digits

    // xxx.xxx.xxx-xx
    if (value.length > 3) value = `${value.slice(0, 3)}.${value.slice(3)}`;
    if (value.length > 7) value = `${value.slice(0, 7)}.${value.slice(7)}`;
    if (value.length > 11) value = `${value.slice(0, 11)}-${value.slice(11)}`;

    setFormData((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const handleDateMask = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Only numbers
    if (value.length > 8) value = value.slice(0, 8); // Max 8 digits (ddmmaaaa)

    // dd/mm/aaaa
    if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
    if (value.length > 5) value = `${value.slice(0, 5)}/${value.slice(5)}`;

    setFormData((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const formatDateToISO = (dateStr) => {
    if (!dateStr || !dateStr.includes("/")) return null;
    const [day, month, year] = dateStr.split("/");
    if (!day || !month || !year || year.length !== 4) return null;
    return `${year}-${month}-${day}`;
  };

  const formatDateToDisplay = (isoStr) => {
    if (!isoStr) return "";
    // Handle both YYYY-MM-DD and full ISO strings
    const datePart = isoStr.split("T")[0];
    const [year, month, day] = datePart.split("-");
    if (!year || !month || !day) return isoStr;
    return `${day}/${month}/${year}`;
  };

  const saveObservation = async () => {
    if (!newObservation.trim()) return;
    try {
      const { error } = await supabase.from("visit_observations").insert({
        visit_id: visit.id,
        author_id: profile.id, // or user.id
        content: newObservation,
      });
      if (error) throw error;
      setNewObservation("");
      fetchObservations(visit.id);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar observação");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Custom Validation
    const requiredFields = [
      { key: "name", label: "Nome Completo" },
      { key: "cpf", label: "CPF" },
      { key: "phone1", label: "Celular (WhatsApp)" },
      { key: "city", label: "Cidade" },
      { key: "neighborhood", label: "Bairro" },
      { key: "address_street", label: "Rua" },
      { key: "address_number", label: "Número" },
    ];

    const missingFields = isOldTask 
      ? [] 
      : requiredFields
          .filter((f) => !formData[f.key]?.trim())
          .map((f) => f.label);

    if (missingFields.length > 0) {
      alert(
        "Por favor, preencha os seguintes campos obrigatórios:\n\n" +
          missingFields.join("\n")
      );
      return;
    }

    setLoading(true);
    try {
      // 1. Prepare Data
      const dataToSave = {
        ...formData,
        date_predicted: formatDateToISO(formData.date_predicted),
        date_effective: formatDateToISO(formData.date_effective),
        // Ensure empty strings are sent as null for DB compatibility
        agent_id: formData.agent_id || null, 
      };

      let result;
      if (isEditing) {
        // UPDATE
        const { data, error } = await supabase
          .from("visits")
          .update(dataToSave)
          .eq("id", visit.id)
          .select()
          .single();

        if (error) throw error;
        result = data;

        // Log History (Simplified - could calculate diff)
        await supabase.from("visit_history").insert({
          visit_id: visit.id,
          changed_by: profile.id,
          action: "UPDATED",
          changes: { old: visit, new: data }, // Saving full objects for simplicity now
        });
      } else {
        // CREATE
        const { data, error } = await supabase
          .from("visits")
          .insert(dataToSave)
          .select()
          .single();

        if (error) throw error;
        result = data;

        // Log History
        // For new visits, we don't need 'old'
        await supabase.from("visit_history").insert({
          visit_id: result.id,
          changed_by: profile.id,
          action: "CREATED",
          changes: { new: result },
        });
      }

      onClose();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar vistoria: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} glass-panel`}>
        {/* Header */}
        <div className={styles.header}>
          <h2>{isEditing ? "Editar Vistoria" : "Nova Vistoria"}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        {isEditing && (
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${
                activeTab === "details" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("details")}
            >
              <FileText size={16} /> Detalhes
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === "observations" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("observations")}
            >
              <MessageSquare size={16} /> Observações
            </button>
            {!isAgent && (
              <button
                className={`${styles.tab} ${
                  activeTab === "history" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("history")}
              >
                <Clock size={16} /> Histórico
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>
          {activeTab === "details" && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.section}>
                <h3>Dados do Contribuinte</h3>
                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label>
                      Nome Completo {!isOldTask && <span style={{ color: "red" }}>*</span>}
                    </label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!canEditDetails}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>
                      CPF {!isOldTask && <span style={{ color: "red" }}>*</span>}
                    </label>
                    <input
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleCpfMask}
                      disabled={!canEditDetails}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label>
                      Celular (WhatsApp) {!isOldTask && <span style={{ color: "red" }}>*</span>}
                    </label>
                    <input
                      name="phone1"
                      value={formData.phone1}
                      onChange={handlePhoneMask}
                      disabled={!canEditDetails}
                      placeholder="(XX) 9XXXX-XXXX"
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Telefone 2</label>
                    <input
                      name="phone2"
                      value={formData.phone2}
                      onChange={handlePhoneMask}
                      disabled={!canEditDetails}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h3>Localização</h3>
                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label>
                      Cidade {!isOldTask && <span style={{ color: "red" }}>*</span>}
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={(e) => {
                        handleChange(e);
                        setFormData((p) => ({ ...p, neighborhood: "" }));
                      }}
                      disabled={!canEditDetails}
                    >
                      <option value="">Selecione...</option>
                      {cidadesData.data.map((c) => (
                        <option key={c.id} value={c.nome}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>
                      Bairro {!isOldTask && <span style={{ color: "red" }}>*</span>}
                    </label>
                    <select
                      name="neighborhood"
                      value={formData.neighborhood}
                      onChange={handleChange}
                      disabled={!canEditDetails || !formData.city}
                    >
                      <option value="">Selecione...</option>
                      {availableNeighborhoods.map((b) => (
                        <option key={b.id} value={b.nome}>
                          {b.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label>Quadra</label>
                    <input
                      name="address_block"
                      value={formData.address_block}
                      onChange={handleChange}
                      disabled={!canEditDetails}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Lote</label>
                    <input
                      name="address_lot"
                      value={formData.address_lot}
                      onChange={handleChange}
                      disabled={!canEditDetails}
                    />
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label>
                      Rua {!isOldTask && <span style={{ color: "red" }}>*</span>}
                    </label>
                    <input
                      name="address_street"
                      value={formData.address_street}
                      onChange={handleChange}
                      disabled={!canEditDetails}
                      placeholder="Nome da rua"
                    />
                  </div>
                  <div className={styles.inputGroup} style={{ maxWidth: "120px" }}>
                    <label>
                      Número {!isOldTask && <span style={{ color: "red" }}>*</span>}
                    </label>
                    <input
                      name="address_number"
                      value={formData.address_number}
                      onChange={handleChange}
                      disabled={!canEditDetails}
                      placeholder="Ex: 123"
                    />
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label>Link da Localização (Google Maps)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        name="location_url"
                        value={formData.location_url}
                        onChange={handleChange}
                        disabled={!canEditDetails}
                        placeholder="https://maps.google.com/?q=..."
                        style={{ flex: 1 }}
                      />
                      {formData.location_url && (
                        <LocationLink 
                          url={formData.location_url} 
                          className={styles.mapBtn} 
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h3>Dados da Vistoria</h3>
                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      disabled={!canEditStatus}
                      className={styles.statusSelect}
                    >
                      <option value="Agendar Vistoria">Agendar Vistoria</option>
                      <option value="Vistoria Agendada">
                        Vistoria Agendada
                      </option>
                      <option value="Vistoria realizada com sucesso">
                        Vistoria realizada com sucesso
                      </option>
                      <option value="Vistoria realizada sem sucesso">
                        Vistoria realizada sem sucesso
                      </option>
                      <option value="Vistoria realizada (aguardando alterações)">
                        Vistoria realizada (aguardando alterações)
                      </option>
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Agente</label>
                    <select
                      name="agent_id"
                      value={formData.agent_id}
                      onChange={handleChange}
                      disabled={!canEditDetails}
                    >
                      <option value="">Selecione...</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label>Data Prevista</label>
                    <input
                      type="text"
                      name="date_predicted"
                      value={formData.date_predicted}
                      onChange={handleDateMask}
                      disabled={!canEditStatus}
                      placeholder="dd/mm/aaaa"
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Data Efetiva</label>
                    <input
                      type="text"
                      name="date_effective"
                      value={formData.date_effective}
                      onChange={handleDateMask}
                      disabled={!canEditStatus}
                      placeholder="dd/mm/aaaa"
                    />
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label>Observação Principal (Legado)</label>
                  <textarea
                    name="observations"
                    value={formData.observations}
                    onChange={handleChange}
                    rows={3}
                    disabled={!canEditDetails}
                  />
                </div>
              </div>

              <div className={styles.footer}>
                <button
                  type="button"
                  onClick={onClose}
                  className={styles.cancelBtn}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={loading}
                >
                  <Save size={18} /> {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "observations" && (
            <div className={styles.tabContent}>
              <div className={styles.newObs}>
                <textarea
                  value={newObservation}
                  onChange={(e) => setNewObservation(e.target.value)}
                  placeholder="Digite uma nova observação..."
                  rows={3}
                />
                <button
                  onClick={saveObservation}
                  className={styles.sendBtn}
                  disabled={!newObservation.trim()}
                >
                  <Send size={16} /> Adicionar
                </button>
              </div>
              <div className={styles.list}>
                {observations.length === 0 && (
                  <p className="text-gray-400 text-center py-4">
                    Nenhuma observação registrada.
                  </p>
                )}
                {observations.map((obs) => (
                  <div key={obs.id} className={styles.listItem}>
                    <div className={styles.itemHeader}>
                      <span className={styles.author}>
                        {obs.profiles?.full_name}
                      </span>
                      <span className={styles.date}>
                        {format(new Date(obs.created_at), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                    <p>{obs.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className={styles.tabContent}>
              <div className={styles.list}>
                {history.map((h) => (
                  <div key={h.id} className={styles.listItem}>
                    <div className={styles.itemHeader}>
                      <span className={styles.author}>
                        {h.profiles?.full_name || "Usuário Desconhecido"}
                      </span>
                      <span className={styles.date}>
                        {format(new Date(h.created_at), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span
                        className={
                          h.action === "CREATED"
                            ? "text-green-400"
                            : "text-blue-400"
                        }
                      >
                        {h.action === "CREATED"
                          ? "Criou o registro"
                          : "Atualizou o registro"}
                      </span>
                      {/* Better Diff Display */}
                      {h.action === "UPDATED" &&
                        h.changes?.old &&
                        h.changes?.new && (
                          <div className="mt-2 text-xs text-gray-400 flex flex-col gap-1">
                            {Object.keys(h.changes.new).map((key) => {
                              const oldValue = h.changes.old[key];
                              const newValue = h.changes.new[key];
                              if (
                                JSON.stringify(oldValue) !==
                                JSON.stringify(newValue)
                              ) {
                                // Ignore internal fields or timestamps if not needed, but dates are useful
                                if (["updated_at", "profiles"].includes(key))
                                  return null;

                                // Format field names for display
                                const fieldLabel =
                                  {
                                    status: "Status",
                                    date_effective: "Data Efetiva",
                                    date_predicted: "Data Prevista",
                                    name: "Nome",
                                    cpf: "CPF",
                                    phone1: "Celular",
                                    phone2: "Telefone 2",
                                    city: "Cidade",
                                    neighborhood: "Bairro",
                                    address_block: "Quadra",
                                    address_lot: "Lote",
                                    address_street: "Rua",
                                    address_number: "Número",
                                    observations: "Obs (Principal)",
                                    agent_id: "Agente",
                                  }[key] || key;

                                let displayOld = oldValue;
                                let displayNew = newValue;

                                // Resolve Agent Name
                                if (key === "agent_id") {
                                  displayOld =
                                    agents.find((a) => a.id === oldValue)
                                      ?.full_name || oldValue;
                                  displayNew =
                                    agents.find((a) => a.id === newValue)
                                      ?.full_name || newValue;
                                }

                                return (
                                  <div key={key}>
                                    <span className="font-semibold">
                                      {fieldLabel}:
                                    </span>{" "}
                                    <span className="line-through opacity-50">
                                      {String(displayOld || "Vazio")}
                                    </span>{" "}
                                    {"->"}{" "}
                                    <span className="text-white">
                                      {String(displayNew || "Vazio")}
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
