import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import styles from "../styles/Visits.module.css";
import { Search, Plus, Filter, Loader2 } from "lucide-react";
import VisitModal from "../components/VisitModal";
import cidadesData from "../data/cidades.json";
import bairrosData from "../data/bairros.json";
import { format } from "date-fns";

export default function Visits() {
  const { profile } = useAuth();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Derived options for filters (only show data present in visits)
  const availableCities = [
    ...new Set(visits.map((v) => v.city).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  const availableNeighborhoods = [
    ...new Set(
      visits
        .filter((v) => !selectedCity || v.city === selectedCity)
        .map((v) => v.neighborhood)
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    setLoading(true);
    let query = supabase
      .from("visits")
      .select(
        `
        *,
        profiles:agent_id (full_name)
      `
      )
      .order("created_at", { ascending: false });

    // Apply role-based filtering if needed (e.g. Agent only sees theirs? Requirement says Agent sees list, maybe all?)
    // Assuming Agent can see all for now as per "Usuário acessa a aplicação, ela exibe lista com os registro das visitas."

    const { data, error } = await query;
    if (error) console.error(error);
    else setVisits(data || []);
    setLoading(false);
  };

  const filteredVisits = visits.filter((visit) => {
    const matchesSearch =
      visit.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.cpf?.includes(searchTerm);
    const matchesCity = !selectedCity || visit.city === selectedCity;
    const matchesNeighborhood =
      !selectedNeighborhood || visit.neighborhood === selectedNeighborhood;
    const matchesStatus = !selectedStatus || visit.status === selectedStatus;

    return matchesSearch && matchesCity && matchesNeighborhood && matchesStatus;
  });

  const handleEdit = (visit) => {
    setSelectedVisit(visit);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setSelectedVisit(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedVisit(null);
    fetchVisits(); // Refresh list
  };

  /* Report generation removed as per user request */

  const getStatusColor = (status) => {
    switch (status) {
      case "Vistoria Finalizada":
        return "var(--status-completed)";
      case "Vistoria Improdutiva":
        return "var(--status-missed)";
      case "Agendamento":
        return "var(--status-scheduled)";
      default:
        return "var(--status-pending)";
    }
  };

  return (
    <div className={styles.container}>
      {/* Header & Actions */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Visitas</h1>
          <p className={styles.subtitle}>Gerencie agendamentos e vistorias</p>
        </div>
        <div className={styles.actions}>
          {(profile?.role === "gestor" || profile?.role === "consultor") && (
            <button
              onClick={handleNew}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              <Plus size={18} />
              Nova Visita
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className={`glass-panel ${styles.filters}`}>
        <div className={styles.searchBox}>
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por Nome ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={selectedCity}
          onChange={(e) => {
            setSelectedCity(e.target.value);
            setSelectedNeighborhood("");
          }}
        >
          <option value="">Todas as Cidades</option>
          {availableCities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={selectedNeighborhood}
          onChange={(e) => setSelectedNeighborhood(e.target.value)}
        >
          <option value="">Todos os Bairros</option>
          {availableNeighborhoods.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">Todos os Status</option>
          <option value="Agendamento">Agendamento</option>
          <option value="1ª Tentativa Agendada">1ª Tentativa</option>
          <option value="2ª Tentativa Agendada">2ª Tentativa</option>
          <option value="Vistoria Finalizada">Finalizada</option>
          <option value="Vistoria Improdutiva">Improdutiva</option>
        </select>
      </div>

      {/* Table */}
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
                <th>Cidade</th>
                <th>Bairro</th>
                <th>Quadra</th>
                <th>Lote</th>
                <th>Contato</th>
                <th>Status</th>
                <th>Agente</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisits.map((visit) => (
                <tr key={visit.id}>
                  <td>
                    <div className="font-medium">{visit.name}</div>
                  </td>
                  <td>{visit.city}</td>
                  <td>{visit.neighborhood}</td>
                  <td>{visit.address_block}</td>
                  <td>{visit.address_lot}</td>
                  <td>
                    <div className="text-sm">{visit.phone1}</div>
                    <div className="text-xs text-gray-400">{visit.phone2}</div>
                  </td>
                  <td>
                    <span
                      className={styles.statusBadge}
                      style={{
                        backgroundColor: `${getStatusColor(visit.status)}20`,
                        color: getStatusColor(visit.status),
                        border: `1px solid ${getStatusColor(visit.status)}`,
                      }}
                    >
                      {visit.status}
                    </span>
                  </td>
                  <td>{visit.profiles?.full_name || "-"}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(visit)}
                      className={styles.linkBtn}
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <VisitModal visit={selectedVisit} onClose={handleModalClose} />
      )}
    </div>
  );
}
