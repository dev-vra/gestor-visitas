import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import styles from "../styles/Vistorias.module.css";
import { Search, Plus, Filter, Loader2 } from "lucide-react";
import VistoriaModal from "../components/VistoriaModal";
import cidadesData from "../data/cidades.json";
import bairrosData from "../data/bairros.json";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { FileDown } from "lucide-react";

export default function Vistorias() {
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
        .filter(Boolean),
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
      `,
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

  const handleExportExcel = () => {
    // 1. Prepare Data
    const dataToExport = filteredVisits.map((v) => ({
      Cidade: v.city,
      Bairro: v.neighborhood,
      Nome: v.name,
      Celular: v.phone1,
      Telefone2: v.phone2,
      Quadra: v.address_block,
      Lote: v.address_lot,
      Status: v.status,
      Observação: v.observations || "-",
      "Data Prevista": v.date_predicted
        ? format(new Date(v.date_predicted), "dd/MM/yyyy")
        : "-",
      Realizado: "", // Checkbox column (empty for print)
    }));

    // 2. Create Sheet
    const ws = XLSX.utils.json_to_sheet(dataToExport);

    // 3. Add Filter Info Header (Hack: Insert at top)
    // We'll use a separate array to handle headers nicely if needed,
    // but standard json_to_sheet creates headers from keys.
    // To add "Meta-headers" like filters, we usually write them first or handle manually.
    // Simple approach: Create workbook, append sheet.
    // Enhanced approach for "Filter text header":
    // It's tricky with simple JSON export. Let's append rows manually or just stick to data.
    // User asked for "Cabeçalho com os valores dos filtro e data de impressão".
    // We can manually construct the worksheet array arrays.

    const filterText = `Filtros: Cidade: ${selectedCity || "Todas"} | Bairro: ${
      selectedNeighborhood || "Todos"
    } | Status: ${selectedStatus || "Todos"} | Busca: ${searchTerm || "-"}`;
    const printDate = `Gerado em: ${new Date().toLocaleString()}`;

    // Convert data to array of arrays
    const headers = Object.keys(dataToExport[0] || {}).length
      ? Object.keys(dataToExport[0])
      : [
          "Cidade",
          "Bairro",
          "Nome",
          "Celular",
          "Telefone2",
          "Quadra",
          "Lote",
          "Status",
          "Observação",
          "Data Prevista",
          "Realizado",
        ];
    const body = dataToExport.map((row) => Object.values(row));

    const finalData = [
      [filterText],
      [printDate],
      [], // Empty row
      headers,
      ...body,
    ];

    const wsWithHeader = XLSX.utils.aoa_to_sheet(finalData);

    // 4. Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsWithHeader, "Vistorias");

    // 5. Download
    XLSX.writeFile(wb, "vistorias.xlsx");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Vistoria Finalizada":
        return "var(--status-completed)";
      case "Vistoria Improdutiva":
        return "var(--status-missed)";
      case "Vistoria em aberto":
        return "var(--status-missed)";
      case "Vistoria Agendada":
        return "var(--status-scheduled)";
      case "Agendar Vistoria":
        return "var(--status-pending)";
      case "Agendamento": // Legacy
        return "var(--status-pending)";
      default:
        return "var(--status-pending)";
    }
  };

  return (
    <div className={styles.container}>
      {/* Header & Actions */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Vistorias</h1>
          <p className={styles.subtitle}>Gerencie agendamentos e vistorias</p>
        </div>
        <div className={styles.actions}>
          <button onClick={handleExportExcel} className={styles.btnSecondary}>
            <FileDown size={18} />
            Exportar Excel
          </button>
          {(profile?.role === "gestor" || profile?.role === "consultor") && (
            <button
              onClick={handleNew}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              <Plus size={18} />
              Nova Vistoria
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
          <option value="Agendar Vistoria">Agendar Vistoria</option>
          <option value="Vistoria Agendada">Vistoria Agendada</option>
          <option value="Vistoria Finalizada">Vistoria Finalizada</option>
          <option value="Vistoria em aberto">Vistoria em aberto</option>
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
        <VistoriaModal visit={selectedVisit} onClose={handleModalClose} />
      )}
    </div>
  );
}
